import { Node, Edge } from 'reactflow';
// @ts-ignore
import dagre from 'dagre';

export const parseDbmlToFlow = (dbml: string, edgeType: string) => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const lines = dbml.split('\n');
  
  let currentTable: any = null;
  const connectedColumns = new Set<string>();
  const validConnections = new Set<string>();

  const addEdge = (t1: string, c1: string, t2: string, c2: string, op: string) => {
       if (t1 && t2) {
           connectedColumns.add(`${t1}.${c1}`);
           connectedColumns.add(`${t2}.${c2}`);
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
       }
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    
    if (trimmed.startsWith('Table')) {
      const tableName = trimmed.split(' ')[1];
      currentTable = {
        id: tableName,
        type: 'table',
        data: { label: tableName, columns: [] },
        position: { x: 0, y: 0 }
      };
      nodes.push(currentTable);
    } 
    else if (trimmed.startsWith('}')) {
      currentTable = null;
    } 
    else if (currentTable && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('Note') && !trimmed.startsWith('Ref:')) {
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
       // Assuming name is first word, rest is type
       const parts = lineWithoutSettings.split(/\s+/);
       if (parts.length >= 2) {
           const name = parts[0];
           const type = parts.slice(1).join(' ');
           
           let key = '';
           if (settings.toLowerCase().includes('pk') || settings.toLowerCase().includes('primary key')) key = 'PK';
           
           // Check for inline ref in settings
           // ref: > table.col
           const refMatch = settings.match(/ref:\s*([<>=-]+)\s*([\w.]+)/i);
           if (refMatch) {
               key = 'FK';
               const op = refMatch[1];
               const target = refMatch[2];
               const [t2, c2] = target.split('.');
               addEdge(currentTable.id, name, t2, c2, op);
           }
           
           currentTable.data.columns.push({ name, type, key });
       }
    }
    else if (trimmed.startsWith('Ref')) {
        const match = trimmed.match(/Ref\s*(?:[\w]+\s*:|:)?\s*([\w.]+)\s*([<>=-]+)\s*([\w.]+)/);
        if (match) {
           const [, left, op, right] = match;
           const [t1, c1] = left.trim().split('.');
           const [t2, c2] = right.trim().split('.');
           addEdge(t1, c1, t2, c2, op);
        }
    }
  });

  nodes.forEach(node => {
      node.data.columns = node.data.columns.map((col: any) => ({
          ...col,
          isConnected: connectedColumns.has(`${node.id}.${col.name}`)
      }));
  });

  return { nodes, edges, validConnections };
};

export const getLayoutedElements = (nodes: Node[], edges: Edge[]) => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  const nodeWidth = 220;
  const nodeHeight = 200;

  dagreGraph.setGraph({ rankdir: 'LR' });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
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
