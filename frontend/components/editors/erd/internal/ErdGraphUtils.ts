import { Node, Edge } from 'reactflow';
// @ts-ignore
import dagre from 'dagre';

export interface ColumnDef {
  name: string;
  type: string;
  key: string;  // 'PK' | 'FK' | ''
  isConnected?: boolean;
  isReferenceTarget?: boolean;
  unique?: boolean;
  notNull?: boolean;
  increment?: boolean;
  defaultValue?: string;
  note?: string;
  check?: string;
}

export interface IndexDef {
  columns: string[];  // column names or expressions
  isPk?: boolean;
  isUnique?: boolean;
  name?: string;
  note?: string;
  type?: string;  // btree, hash, gin, gist
}

export interface CheckDef {
  expression: string;
  name?: string;
}

export interface TableDef {
  id: string;
  columns: ColumnDef[];
  indexes: IndexDef[];
  checks: CheckDef[];
  alias?: string;
}

export const parseDbmlToFlow = (dbml: string, edgeType: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const lines = dbml.split('\n');

  let currentTable: TableDef | null = null;
  let inBlockType: 'columns' | 'indexes' | 'checks' | null = null;
  const connectedColumns = new Set<string>();
  const referencedColumns = new Set<string>();
  const validConnections = new Set<string>();
  // Deferred refs (processed after all tables are parsed)
  const deferredRefs: { t1: string; c1: string; t2: string; c2: string; op: string }[] = [];
  // Table aliases mapping
  const tableAliases: Record<string, string> = {};

  const addEdge = (t1: string, c1: string, t2: string, c2: string, op: string) => {
       // Resolve aliases
       t1 = tableAliases[t1] || t1;
       t2 = tableAliases[t2] || t2;

       if (!t1 || !t2 || !c1 || !c2) return;
       // Validate both tables and columns exist
       const node1 = nodes.find(n => n.id === t1);
       const node2 = nodes.find(n => n.id === t2);
       if (!node1 || !node2) return;
       const cols1 = node1.data.columns as ColumnDef[];
       const cols2 = node2.data.columns as ColumnDef[];
       if (!cols1.some(c => c.name === c1) || !cols2.some(c => c.name === c2)) return;

       connectedColumns.add(`${t1}.${c1}`);
       connectedColumns.add(`${t2}.${c2}`);
       // Track which columns are reference targets (where FK points TO)
       if (op.includes('>')) {
           referencedColumns.add(`${t2}.${c2}`);
       } else if (op.includes('<')) {
           referencedColumns.add(`${t1}.${c1}`);
       } else {
           referencedColumns.add(`${t1}.${c1}`);
           referencedColumns.add(`${t2}.${c2}`);
       }
       validConnections.add(`${t1}:${c1}-${t2}:${c2}`);

           let markerStart = 'url(#erd-one-start)';
           let markerEnd = 'url(#erd-one-end)';

           if (op.includes('>')) {
               markerStart = 'url(#erd-many-start)';
               markerEnd = 'url(#erd-one-end)';
           } else if (op.includes('<')) {
               markerStart = 'url(#erd-one-start)';
               markerEnd = 'url(#erd-many-end)';
           } else if (op.includes('-')) {
               markerStart = 'url(#erd-one-start)';
               markerEnd = 'url(#erd-one-end)';
           }

           const edgeId = `e-${t1}-${c1}-${t2}-${c2}`;

           edges.push({
               id: edgeId,
               source: t1,
               sourceHandle: `${c1}-right-source`,
               target: t2,
               targetHandle: `${c2}-left-target`,
               type: edgeType,
               animated: false,
               style: {
                   stroke: '#555',
                   strokeWidth: 1.5,
                   markerStart: markerStart,
                   markerEnd: markerEnd
               }
           });
  };

  // Parse column settings like [pk, unique, not null, default: 'value', note: 'text', ref: > table.col]
  const parseColumnSettings = (settings: string): Partial<ColumnDef> => {
    const result: Partial<ColumnDef> = {};

    // Handle pk / primary key
    if (/\bpk\b/i.test(settings) || /primary\s+key/i.test(settings)) {
      result.key = 'PK';
    }

    // Handle unique
    if (/\bunique\b/i.test(settings)) {
      result.unique = true;
    }

    // Handle not null / null
    if (/\bnot\s+null\b/i.test(settings)) {
      result.notNull = true;
    }

    // Handle increment / autoincrement
    if (/\bincrement\b/i.test(settings) || /\bautoincrement\b/i.test(settings)) {
      result.increment = true;
    }

    // Handle default: value or default: `expression`
    const defaultMatch = settings.match(/default:\s*(?:`([^`]*)`|'([^']*)'|"([^"]*)"|(\S+?)(?:,|\]|$))/i);
    if (defaultMatch) {
      result.defaultValue = defaultMatch[1] || defaultMatch[2] || defaultMatch[3] || defaultMatch[4];
    }

    // Handle note: 'text'
    const noteMatch = settings.match(/note:\s*(?:'([^']*)'|"([^"]*)")/i);
    if (noteMatch) {
      result.note = noteMatch[1] || noteMatch[2];
    }

    // Handle inline check: `expression`
    const checkMatch = settings.match(/check:\s*`([^`]*)`/i);
    if (checkMatch) {
      result.check = checkMatch[1];
    }

    return result;
  };

  // Parse index definition like: (col1, col2) [pk, unique, name: 'idx_name']
  const parseIndexLine = (line: string): IndexDef | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return null;

    // Extract settings
    const settingsMatch = trimmed.match(/\[([^\]]*)\]$/);
    const settings = settingsMatch ? settingsMatch[1] : '';
    const lineWithoutSettings = settingsMatch ? trimmed.substring(0, settingsMatch.index).trim() : trimmed;

    // Parse columns - can be (col1, col2), single col, or expressions like (`id*2`)
    const columns: string[] = [];

    // Handle composite index (col1, col2) or expression (`expr1`, `expr2`)
    const compositeMatch = lineWithoutSettings.match(/^\((.+)\)$/);
    if (compositeMatch) {
      const parts = compositeMatch[1].split(',').map(p => p.trim());
      parts.forEach(p => {
        // Expression in backticks
        const exprMatch = p.match(/^`(.+)`$/);
        if (exprMatch) {
          columns.push(`\`${exprMatch[1]}\``);
        } else {
          columns.push(p);
        }
      });
    } else {
      // Single column or expression
      const exprMatch = lineWithoutSettings.match(/^`(.+)`$/);
      if (exprMatch) {
        columns.push(`\`${exprMatch[1]}\``);
      } else {
        columns.push(lineWithoutSettings);
      }
    }

    if (columns.length === 0) return null;

    const index: IndexDef = { columns };

    // Parse settings
    if (/\bpk\b/i.test(settings)) {
      index.isPk = true;
    }
    if (/\bunique\b/i.test(settings)) {
      index.isUnique = true;
    }

    const nameMatch = settings.match(/name:\s*(?:'([^']*)'|"([^"]*)")/i);
    if (nameMatch) {
      index.name = nameMatch[1] || nameMatch[2];
    }

    const noteMatch = settings.match(/note:\s*(?:'([^']*)'|"([^"]*)")/i);
    if (noteMatch) {
      index.note = noteMatch[1] || noteMatch[2];
    }

    const typeMatch = settings.match(/type:\s*(\w+)/i);
    if (typeMatch) {
      index.type = typeMatch[1].toLowerCase();
    }

    return index;
  };

  // Parse check definition like: `expression` [name: 'chk_name']
  const parseCheckLine = (line: string): CheckDef | null => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//')) return null;

    // Extract expression from backticks
    const exprMatch = trimmed.match(/`([^`]+)`/);
    if (!exprMatch) return null;

    const check: CheckDef = { expression: exprMatch[1] };

    // Extract name from settings
    const settingsMatch = trimmed.match(/\[([^\]]*)\]$/);
    if (settingsMatch) {
      const nameMatch = settingsMatch[1].match(/name:\s*(?:'([^']*)'|"([^"]*)")/i);
      if (nameMatch) {
        check.name = nameMatch[1] || nameMatch[2];
      }
    }

    return check;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Parse Table definition with optional alias
    if (trimmed.startsWith('Table')) {
      const tableMatch = trimmed.match(/^Table\s+(\S+?)(?:\s+as\s+(\w+))?\s*\{?$/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const alias = tableMatch[2];

        currentTable = {
          id: tableName,
          columns: [],
          indexes: [],
          checks: [],
          alias,
        };

        if (alias) {
          tableAliases[alias] = tableName;
        }

        inBlockType = 'columns';

        nodes.push({
          id: tableName,
          type: 'table',
          data: {
            label: tableName,
            columns: currentTable.columns,
            indexes: currentTable.indexes,
            checks: currentTable.checks,
          },
          position: { x: 0, y: 0 }
        });
      }
    }
    else if (trimmed === '}') {
      if (inBlockType === 'indexes' || inBlockType === 'checks') {
        inBlockType = 'columns';
      } else {
        currentTable = null;
        inBlockType = null;
      }
    }
    else if (currentTable && trimmed.toLowerCase() === 'indexes {') {
      inBlockType = 'indexes';
    }
    else if (currentTable && trimmed.toLowerCase() === 'checks {') {
      inBlockType = 'checks';
    }
    else if (currentTable && inBlockType === 'indexes') {
      const index = parseIndexLine(trimmed);
      if (index) {
        currentTable.indexes.push(index);
        // Update node data
        const node = nodes.find(n => n.id === currentTable!.id);
        if (node) {
          node.data.indexes = currentTable.indexes;
        }
      }
    }
    else if (currentTable && inBlockType === 'checks') {
      const check = parseCheckLine(trimmed);
      if (check) {
        currentTable.checks.push(check);
        // Update node data
        const node = nodes.find(n => n.id === currentTable!.id);
        if (node) {
          node.data.checks = currentTable.checks;
        }
      }
    }
    else if (currentTable && inBlockType === 'columns' && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('Note') && !trimmed.startsWith('Ref:')) {
       // Format: name type [settings]
       // Extract settings first
       const settingsMatch = trimmed.match(/\[(.*?)\]$/);
       let settings = '';
       let lineWithoutSettings = trimmed;

       if (settingsMatch) {
           settings = settingsMatch[1];
           lineWithoutSettings = trimmed.substring(0, settingsMatch.index).trim();
       }

       // Split name and type
       const parts = lineWithoutSettings.split(/\s+/);
       if (parts.length >= 2) {
           const name = parts[0];
           const type = parts.slice(1).join(' ');

           const parsedSettings = parseColumnSettings(settings);

           const column: ColumnDef = {
             name,
             type,
             key: parsedSettings.key || '',
             unique: parsedSettings.unique,
             notNull: parsedSettings.notNull,
             increment: parsedSettings.increment,
             defaultValue: parsedSettings.defaultValue,
             note: parsedSettings.note,
             check: parsedSettings.check,
           };

           // Check for inline ref in settings
           const refMatch = settings.match(/ref:\s*([<>=-]+)\s*([\w.]+)/i);
           if (refMatch) {
               column.key = 'FK';
               const op = refMatch[1];
               const target = refMatch[2];
               const [t2, c2] = target.split('.');
               deferredRefs.push({ t1: currentTable.id, c1: name, t2, c2, op });
           }

           currentTable.columns.push(column);

           // Update node data
           const node = nodes.find(n => n.id === currentTable!.id);
           if (node) {
             node.data.columns = currentTable.columns;
           }
       }
    }
    else if (trimmed.startsWith('Ref')) {
        const match = trimmed.match(/Ref\s*(?:[\w]+\s*:|:)?\s*([\w.]+)\s*([<>=-]+)\s*([\w.]+)/);
        if (match) {
           const [, left, op, right] = match;
           const [t1, c1] = left.trim().split('.');
           const [t2, c2] = right.trim().split('.');
           deferredRefs.push({ t1, c1, t2, c2, op });
        }
    }
  });

  // Process all refs after all tables/columns are known
  deferredRefs.forEach(({ t1, c1, t2, c2, op }) => addEdge(t1, c1, t2, c2, op));

  nodes.forEach(node => {
      node.data.columns = node.data.columns.map((col: ColumnDef) => {
          const colId = `${node.id}.${col.name}`;
          let key = col.key;
          // Mark FK for columns that are sources of references (from external Ref: syntax)
          if (!key && connectedColumns.has(colId) && !referencedColumns.has(colId)) {
              key = 'FK';
          }
          return {
              ...col,
              key,
              isConnected: connectedColumns.has(colId),
              isReferenceTarget: referencedColumns.has(colId)
          };
      });
  });

  return { nodes, edges, validConnections };
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 200;

  dagreGraph.setGraph({ rankdir: 'LR', nodesep: 60, ranksep: 80 });

  const nodeIds = new Set(nodes.map(n => n.id));

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  // Only add edges whose source and target are both present in the graph
  edges.forEach((edge) => {
    if (nodeIds.has(edge.source) && nodeIds.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
    }
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
  });

  return { nodes, edges };
};
