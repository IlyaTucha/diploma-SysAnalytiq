import { useState, useRef } from 'react';
import { OnMount } from '@monaco-editor/react';
import { Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSqlRunner } from '@/components/editors/sql/hooks/UseSqlRunner';
import { mockDatasets, schemaMetadata } from '@/mocks/SqlMock';
import { SqlEditorPanel } from '@/components/editors/sql/SqlEditorPanel';

export default function SqlPlayground() {
  const defaultCode = '-- Напишите ваш SQL запрос\nSELECT * FROM users LIMIT 10;';
  const [sqlCode, setSqlCode] = useState(defaultCode);
  const [_dataset, setDataset] = useState('users');
  const [result, setResult] = useState<any>(null);
  
  const { db, error: runnerError, executeQuery } = useSqlRunner();
  const editorRef = useRef<any>(null);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;
  };

  const handleRunQuery = (code?: string) => {
    if (!db) return;
    
    const queryToRun = code || sqlCode;
    const res = executeQuery(queryToRun);
    setResult(res);
  };

  const handleReset = () => {
    setSqlCode(defaultCode);
    setResult(null);
  };

  return (
    <div className="h-full border rounded-xl overflow-hidden bg-card shadow-sm min-h-[600px]">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={30} className="bg-muted/10 border-r">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b bg-muted/20">
              <h3 className="font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                Схема БД
              </h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4">
                <Accordion type="single" collapsible className="w-full">
                  {Object.keys(mockDatasets).map((tableName) => (
                    <AccordionItem key={tableName} value={tableName}>
                      <AccordionTrigger className="text-sm py-2 hover:no-underline hover:bg-muted/50 px-2 rounded">
                        <div className="flex items-center gap-2">
                          <Database className="w-3 h-3 text-muted-foreground" />
                          {tableName}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="pl-4 space-y-1 mt-1">
                          {Object.keys(mockDatasets[tableName as keyof typeof mockDatasets][0]).map((col) => {
                            const isPK = schemaMetadata[tableName]?.pk.includes(col);
                            const isFK = !!schemaMetadata[tableName]?.fks[col];
                            
                            return (
                            <div key={col} className="flex items-center justify-between text-xs py-1 px-2 rounded hover:bg-muted/50 cursor-pointer group"
                                  onClick={() => {
                                    setDataset(tableName);
                                    setSqlCode((prev) => `${prev}\n-- Column: ${col}\nSELECT ${col} FROM ${tableName} LIMIT 5;`);
                                  }}>
                              <div className="flex items-center gap-2">
                                {isPK && <span className="text-[10px] font-bold text-yellow-600 dark:text-yellow-500" title="Primary Key">PK</span>}
                                {isFK && <span className="text-[10px] font-bold text-blue-600 dark:text-blue-500" title={`Foreign Key -> ${schemaMetadata[tableName].fks[col]}`}>FK</span>}
                                <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">{col}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] h-4 px-1 text-muted-foreground">
                                {typeof (mockDatasets[tableName as keyof typeof mockDatasets][0] as any)[col] === 'number' ? 'int' : 'varchar'}
                              </Badge>
                            </div>
                          )})}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />

        <ResizablePanel defaultSize={80}>
          <SqlEditorPanel
            sqlCode={sqlCode}
            setSqlCode={setSqlCode}
            handleRunQuery={handleRunQuery}
            handleReset={handleReset}
            result={result}
            handleEditorDidMount={handleEditorDidMount}
            validationState={runnerError ? 'error' : 'idle'}
            validationMessage={runnerError}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
