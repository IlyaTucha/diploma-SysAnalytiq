import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import Editor from '@monaco-editor/react';
import { GitBranch, Download, FileDown } from 'lucide-react';
import { EditorActions } from '@/components/ui/EditorActions';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { ErdDiagram, ErdVisualEditorRef } from './ErdDiagram';
import { EditorHeader } from '@/components/ui/EditorHeader';

interface ErdEditorPanelProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string | number;
  handleReset?: () => void;
  onMount?: (editor: any, monaco: any) => void;
}

export function ErdEditorPanel({
  code,
  onChange,
  readOnly = false,
  height = "100%",
  handleReset,
  onMount
}: ErdEditorPanelProps) {
  const { theme } = useTheme();
  const [editorKey, setEditorKey] = useState(0);
  const visualEditorRef = useRef<ErdVisualEditorRef>(null);

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

  const handleCodeChange = (newCode: string) => {
    onChange(newCode);
  };

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
    const tables: Record<string, { columns: string[]; constraints: string[] }> = {};
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Table')) {
        const tableName = trimmed.split(' ')[1];
        currentTable = tableName;
        tables[currentTable] = { columns: [], constraints: [] };
      } else if (trimmed.startsWith('}')) {
        currentTable = '';
      } else if (currentTable && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('Note') && !trimmed.startsWith('Ref:')) {
        const parts = trimmed.split(/\s+/);
        if (parts.length >= 2) {
          const name = parts[0];
          const type = parts[1];
          let columnDef = `  ${name} ${type}`;
          if (trimmed.toLowerCase().includes('primary key') || trimmed.toLowerCase().includes('[pk]')) {
            columnDef += ' PRIMARY KEY';
          }
          if (trimmed.toLowerCase().includes('not null')) {
            columnDef += ' NOT NULL';
          }
          tables[currentTable].columns.push(columnDef);
        }
      }
      if (trimmed.startsWith('Ref:')) {
        const relContent = trimmed.replace('Ref:', '').trim();
        const cleanContent = relContent.split('//')[0].trim();
        const [left, op, right] = cleanContent.split(/\s*([><-])\s*/);
        if (left && right) {
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
      } else if (trimmed.toLowerCase().includes('ref:')) {
        const refMatch = trimmed.match(/ref:\s*([><-])\s*([a-zA-Z0-9_.]+)/i);
        if (refMatch && currentTable) {
            const op = refMatch[1];
            const target = refMatch[2];
            const [t2, c2] = target.split('.');
            
            const parts = trimmed.split(/\s+/);
            const c1 = parts[0];

            if (t2 && c2 && c1) {
                 if (op === '>') {
                    tables[currentTable].constraints.push(`  FOREIGN KEY (${c1}) REFERENCES ${t2}(${c2})`);
                 } else if (op === '<') {
                     if (tables[t2]) {
                         tables[t2].constraints.push(`  FOREIGN KEY (${c2}) REFERENCES ${currentTable}(${c1})`);
                     }
                 } else if (op === '-') {
                     tables[currentTable].constraints.push(`  FOREIGN KEY (${c1}) REFERENCES ${t2}(${c2})`);
                 }
            }
        }
      }
    });
    Object.keys(tables).forEach(tableName => {
      sql += `CREATE TABLE ${tableName} (\n`;
      const tableData = tables[tableName];
      const allLines = [...tableData.columns, ...tableData.constraints];
      sql += allLines.join(',\n');
      sql += '\n);\n\n';
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
                  defaultLanguage="apex"
                  value={code}
                  onChange={(value) => handleCodeChange(value || '')}
                  onMount={onMount}
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
                <ErdDiagram key={editorKey} code={code} ref={visualEditorRef} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
} 