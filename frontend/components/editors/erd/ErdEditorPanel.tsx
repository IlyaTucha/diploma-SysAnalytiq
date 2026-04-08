import { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { GitBranch, Download, FileDown } from 'lucide-react';
import { EditorActions } from '@/components/ui/EditorActions';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ErdDiagram, ErdVisualEditorRef, ErdLayout } from './ErdDiagram';
import { EditorHeader } from '@/components/ui/EditorHeader';

export interface ErdEditorPanelRef {
  getLayout: () => ErdLayout;
}

interface ErdEditorPanelProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string | number;
  handleReset?: () => void;
  onMount?: (editor: any, monaco: any) => void;
  initialLayout?: ErdLayout | null;
}

export const ErdEditorPanel = forwardRef<ErdEditorPanelRef, ErdEditorPanelProps>(function ErdEditorPanel({
  code,
  onChange,
  readOnly = false,
  height = "100%",
  handleReset,
  onMount: externalOnMount,
  initialLayout,
}, ref) {
  const { theme } = useTheme();
  const [editorKey, setEditorKey] = useState(0);
  const visualEditorRef = useRef<ErdVisualEditorRef>(null);
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lastSentValue = useRef(code);

  useImperativeHandle(ref, () => ({
    getLayout: () => visualEditorRef.current?.getLayout() ?? { nodePositions: {}, edgeData: {} },
  }));

  const [history, setHistory] = useState<string[]>([code]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoing = useRef(false);
  const isResetting = useRef(false);

  useEffect(() => {
    if (isUndoing.current) {
      isUndoing.current = false;
      return;
    }

    if (isResetting.current) {
      setHistory([code]);
      setCurrentIndex(0);
      isResetting.current = false;
      return;
    }

    if (code !== history[currentIndex]) {
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(code);
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  // Sync external code changes to editor (e.g., reset)
  // Only update if code is different from what we last sent (external change)
  useEffect(() => {
    if (editorRef.current && code !== lastSentValue.current) {
      const position = editorRef.current.getPosition();
      editorRef.current.setValue(code);
      lastSentValue.current = code;
      // Restore cursor position
      if (position) {
        editorRef.current.setPosition(position);
      }
    }
  }, [code]);

  const onReset = () => {
    if (handleReset) {
      isResetting.current = true;
      handleReset();
      setEditorKey(prev => prev + 1);
    }
  };

  const handleExportSQL = () => {
    let sql = '';
    const lines = code.split('\n');
    let currentTable = '';
    let inBlockType: 'columns' | 'indexes' | 'checks' | null = null;

    interface TableData {
      columns: string[];
      constraints: string[];
      indexes: string[];
      checks: string[];
    }

    const tables: Record<string, TableData> = {};

    const parseColumnSettings = (settings: string) => {
      const result: {
        isPk?: boolean;
        isUnique?: boolean;
        isNotNull?: boolean;
        isIncrement?: boolean;
        defaultValue?: string;
        check?: string;
      } = {};

      if (/\bpk\b/i.test(settings) || /primary\s+key/i.test(settings)) result.isPk = true;
      if (/\bunique\b/i.test(settings)) result.isUnique = true;
      if (/\bnot\s+null\b/i.test(settings)) result.isNotNull = true;
      if (/\bincrement\b/i.test(settings) || /\bautoincrement\b/i.test(settings)) result.isIncrement = true;

      const defaultMatch = settings.match(/default:\s*(?:`([^`]*)`|'([^']*)'|"([^"]*)"|(\S+?)(?:,|\]|$))/i);
      if (defaultMatch) {
        const val = defaultMatch[1] || defaultMatch[2] || defaultMatch[3] || defaultMatch[4];
        // Expression in backticks -> no quotes, string -> with quotes
        result.defaultValue = defaultMatch[1] ? val : `'${val}'`;
      }

      const checkMatch = settings.match(/check:\s*`([^`]*)`/i);
      if (checkMatch) result.check = checkMatch[1];

      return result;
    };

    lines.forEach(line => {
      const trimmed = line.trim();

      // Parse Table definition with optional alias
      if (trimmed.startsWith('Table')) {
        const tableMatch = trimmed.match(/^Table\s+(\S+?)(?:\s+as\s+\w+)?\s*\{?$/i);
        if (tableMatch) {
          currentTable = tableMatch[1];
          tables[currentTable] = { columns: [], constraints: [], indexes: [], checks: [] };
          inBlockType = 'columns';
        }
      } else if (trimmed === '}') {
        if (inBlockType === 'indexes' || inBlockType === 'checks') {
          inBlockType = 'columns';
        } else {
          currentTable = '';
          inBlockType = null;
        }
      } else if (currentTable && trimmed.toLowerCase() === 'indexes {') {
        inBlockType = 'indexes';
      } else if (currentTable && trimmed.toLowerCase() === 'checks {') {
        inBlockType = 'checks';
      } else if (currentTable && inBlockType === 'indexes' && trimmed && !trimmed.startsWith('//')) {
        // Parse index line
        const settingsMatch = trimmed.match(/\[([^\]]*)\]$/);
        const settings = settingsMatch ? settingsMatch[1] : '';
        const lineWithoutSettings = settingsMatch ? trimmed.substring(0, settingsMatch.index).trim() : trimmed;

        const columns: string[] = [];
        const compositeMatch = lineWithoutSettings.match(/^\((.+)\)$/);
        if (compositeMatch) {
          const parts = compositeMatch[1].split(',').map(p => p.trim());
          parts.forEach(p => {
            const exprMatch = p.match(/^`(.+)`$/);
            columns.push(exprMatch ? `(${exprMatch[1]})` : p);
          });
        } else {
          const exprMatch = lineWithoutSettings.match(/^`(.+)`$/);
          columns.push(exprMatch ? `(${exprMatch[1]})` : lineWithoutSettings);
        }

        if (columns.length > 0) {
          const isUnique = /\bunique\b/i.test(settings);
          const isPk = /\bpk\b/i.test(settings);
          const nameMatch = settings.match(/name:\s*(?:'([^']*)'|"([^"]*)")/i);
          const indexName = nameMatch ? (nameMatch[1] || nameMatch[2]) : `idx_${currentTable}_${columns.join('_').replace(/[^a-z0-9_]/gi, '')}`;
          const typeMatch = settings.match(/type:\s*(\w+)/i);
          const indexType = typeMatch ? ` USING ${typeMatch[1].toUpperCase()}` : '';

          if (isPk) {
            // Composite primary key
            tables[currentTable].constraints.push(`  PRIMARY KEY (${columns.join(', ')})`);
          } else {
            const uniqueStr = isUnique ? 'UNIQUE ' : '';
            tables[currentTable].indexes.push(`CREATE ${uniqueStr}INDEX ${indexName} ON ${currentTable}${indexType} (${columns.join(', ')});`);
          }
        }
      } else if (currentTable && inBlockType === 'checks' && trimmed && !trimmed.startsWith('//')) {
        // Parse check constraint
        const exprMatch = trimmed.match(/`([^`]+)`/);
        if (exprMatch) {
          const settingsMatch = trimmed.match(/\[([^\]]*)\]$/);
          const settings = settingsMatch ? settingsMatch[1] : '';
          const nameMatch = settings.match(/name:\s*(?:'([^']*)'|"([^"]*)")/i);
          const checkName = nameMatch ? (nameMatch[1] || nameMatch[2]) : null;

          if (checkName) {
            tables[currentTable].checks.push(`  CONSTRAINT ${checkName} CHECK (${exprMatch[1]})`);
          } else {
            tables[currentTable].checks.push(`  CHECK (${exprMatch[1]})`);
          }
        }
      } else if (currentTable && inBlockType === 'columns' && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('Note') && !trimmed.startsWith('Ref:')) {
        // Parse column
        const settingsMatch = trimmed.match(/\[(.*?)\]$/);
        const settings = settingsMatch ? settingsMatch[1] : '';
        const lineWithoutSettings = settingsMatch ? trimmed.substring(0, settingsMatch.index).trim() : trimmed;

        const parts = lineWithoutSettings.split(/\s+/);
        if (parts.length >= 2) {
          const name = parts[0];
          let type = parts[1].toUpperCase();
          const parsed = parseColumnSettings(settings);

          // Convert common DBML types to SQL
          if (type === 'INT' || type === 'INTEGER') {
            type = parsed.isIncrement ? 'SERIAL' : 'INTEGER';
          } else if (type === 'BIGINT' && parsed.isIncrement) {
            type = 'BIGSERIAL';
          }

          let columnDef = `  ${name} ${type}`;
          if (parsed.isPk) columnDef += ' PRIMARY KEY';
          if (parsed.isUnique) columnDef += ' UNIQUE';
          if (parsed.isNotNull) columnDef += ' NOT NULL';
          if (parsed.defaultValue) columnDef += ` DEFAULT ${parsed.defaultValue}`;
          if (parsed.check) columnDef += ` CHECK (${parsed.check})`;

          tables[currentTable].columns.push(columnDef);

          // Handle inline ref
          const refMatch = settings.match(/ref:\s*([><-])\s*([a-zA-Z0-9_.]+)/i);
          if (refMatch) {
            const op = refMatch[1];
            const target = refMatch[2];
            const [t2, c2] = target.split('.');
            if (t2 && c2) {
              if (op === '>' || op === '-') {
                tables[currentTable].constraints.push(`  FOREIGN KEY (${name}) REFERENCES ${t2}(${c2})`);
              }
            }
          }
        }
      }

      // Handle standalone Ref:
      if (trimmed.startsWith('Ref:')) {
        const relContent = trimmed.replace('Ref:', '').trim();
        const cleanContent = relContent.split('//')[0].trim();
        const match = cleanContent.match(/^([\w.]+)\s*([><-])\s*([\w.]+)/);
        if (match) {
          const [, left, op, right] = match;
          const [t1, c1] = left.split('.');
          const [t2, c2] = right.split('.');
          if (t1 && c1 && t2 && c2) {
            if (op === '>') {
              if (tables[t1]) {
                tables[t1].constraints.push(`  FOREIGN KEY (${c1}) REFERENCES ${t2}(${c2})`);
              }
            } else if (op === '<') {
              if (tables[t2]) {
                tables[t2].constraints.push(`  FOREIGN KEY (${c2}) REFERENCES ${t1}(${c1})`);
              }
            } else if (op === '-') {
              if (tables[t1]) {
                tables[t1].constraints.push(`  FOREIGN KEY (${c1}) REFERENCES ${t2}(${c2})`);
              }
            }
          }
        }
      }
    });

    // Generate CREATE TABLE statements
    Object.keys(tables).forEach(tableName => {
      sql += `CREATE TABLE ${tableName} (\n`;
      const tableData = tables[tableName];
      const allLines = [...tableData.columns, ...tableData.constraints, ...tableData.checks];
      sql += allLines.join(',\n');
      sql += '\n);\n\n';
    });

    // Generate CREATE INDEX statements
    Object.keys(tables).forEach(tableName => {
      const tableData = tables[tableName];
      if (tableData.indexes.length > 0) {
        sql += tableData.indexes.join('\n') + '\n\n';
      }
    });

    const blob = new Blob([sql], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schema.sql';
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleDownloadImage = async () => {
    if (visualEditorRef.current) {
      await visualEditorRef.current.handleExportImage();
    }
  };

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Listen to content changes and propagate to parent
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      lastSentValue.current = value;
      onChange(value);
    });

    if (!monaco.languages.getLanguages().some((lang: any) => lang.id === 'dbml')) {
      monaco.languages.register({ id: 'dbml' });
      monaco.languages.setMonarchTokensProvider('dbml', {
        keywords: ['Table', 'Ref', 'Enum', 'Note', 'indexes', 'checks', 'as', 'Indexes', 'Checks'],
        typeKeywords: [
          'int', 'integer', 'bigint', 'smallint', 'tinyint', 'serial', 'bigserial',
          'float', 'double', 'decimal', 'numeric', 'real',
          'varchar', 'char', 'text', 'string', 'nvarchar', 'nchar',
          'boolean', 'bool',
          'date', 'datetime', 'timestamp', 'timestamptz', 'time',
          'uuid', 'json', 'jsonb', 'xml',
          'blob', 'bytea', 'binary', 'varbinary',
        ],
        modifiers: ['pk', 'primary', 'key', 'not', 'null', 'unique', 'increment', 'autoincrement', 'default', 'note', 'ref', 'check', 'name', 'type', 'hash', 'btree', 'gin', 'gist'],
        tokenizer: {
          root: [
            [/\/\/.*$/, 'comment'],
            [/'[^']*'/, 'string'],
            [/"[^"]*"/, 'string'],
            [/[{}()[\]]/, 'delimiter.bracket'],
            [/[><-]/, 'operator'],
            [/[a-zA-Z_]\w*/, {
              cases: {
                '@keywords': 'keyword',
                '@typeKeywords': 'type',
                '@modifiers': 'keyword.modifier',
                '@default': 'identifier',
              }
            }],
            [/\d+/, 'number'],
            [/[ \t\r\n]+/, ''],
            [/[,.:;]/, 'delimiter'],
          ],
        },
      });
    }
    externalOnMount?.(editor, monaco);
  }, [onChange, externalOnMount]);

  return (
    <div className="h-full flex-1 flex flex-col" style={{ height }}>
      <div className="flex-1 border rounded-lg overflow-hidden relative flex flex-col">
        <EditorHeader
          icon={<GitBranch className="w-4 h-4 text-muted-foreground" />}
          title="ERD Editor (DBML)"
          actions={
            !readOnly ? <EditorActions
              actions={[
                {
                  label: 'Экспорт SQL',
                  icon: <FileDown className="w-4 h-4 mr-2" />, 
                  onClick: handleExportSQL,
                  title: 'Экспорт SQL',
                },
                {
                  label: 'Экспорт PNG',
                  icon: <Download className="w-4 h-4 mr-2" />, 
                  onClick: handleDownloadImage,
                  title: 'Экспорт PNG',
                },
              ]}
              onReset={handleReset ? onReset : undefined}
            /> : undefined
          }
          className="bg-muted/20"
        />
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full flex flex-col p-0">
                <Editor
                  height="100%"
                  defaultLanguage="dbml"
                  defaultValue={code}
                  onMount={handleEditorMount}
                  theme={theme === 'dark' ? 'vs-dark' : 'light'}
                  loading={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Загрузка редактора...</div>}
                  options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    padding: { top: 16, bottom: 16 },
                    readOnly: readOnly,
                    quickSuggestions: false,
                    suggestOnTriggerCharacters: false,
                    snippetSuggestions: 'none',
                    wordBasedSuggestions: 'off',
                  }}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60} minSize={20}>
              <div className={`h-full flex flex-col p-0 ${theme === 'dark' ? 'dark bg-zinc-950' : 'bg-white'}`}>
                <ErdDiagram key={editorKey} code={code} ref={visualEditorRef} readOnly={readOnly} initialLayout={initialLayout} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
});