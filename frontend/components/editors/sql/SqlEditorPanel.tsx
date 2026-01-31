import { useRef } from 'react';
import { EditorActions } from '@/components/ui/EditorActions';
import { Code, Play } from 'lucide-react';
import Editor, { OnMount } from '@monaco-editor/react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { SqlResultsTable } from './ui/SqlResultsTable';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { EditorHeader } from '@/components/ui/EditorHeader';

interface SqlEditorPanelProps {
  sqlCode: string;
  setSqlCode: (code: string) => void;
  handleRunQuery: (code: string) => void;
  handleReset: () => void;
  result: any;
  handleEditorDidMount?: OnMount;
  validationState?: 'idle' | 'success' | 'error';
  validationMessage?: string | null;
  height?: string | number;
}

export function SqlEditorPanel({
  sqlCode,
  setSqlCode,
  handleRunQuery,
  handleReset,
  result,
  handleEditorDidMount,
  validationState,
  validationMessage,
  height = "100%"
}: SqlEditorPanelProps) {
  const { theme } = useTheme();
  const editorRef = useRef<any>(null);

  const handleEditorOnMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    if (handleEditorDidMount) {
      handleEditorDidMount(editor, monaco);
    }
  };

  const handleRunClick = () => {
    let queryToRun = sqlCode;
    
    if (editorRef.current) {
      const selection = editorRef.current.getSelection();
      if (selection && !selection.isEmpty()) {
        const selectedText = editorRef.current.getModel()?.getValueInRange(selection);
        if (selectedText) {
          queryToRun = selectedText;
        }
      }
    }
    
    handleRunQuery(queryToRun);
  };

  return (
    <div className="h-full flex flex-col w-full min-h-[300px] border rounded-xl overflow-hidden" style={{ height }}>
      <ResizablePanelGroup direction="vertical" className="h-full w-full min-h-[300px]" style={{ height: '100%' }}>
        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col bg-background overflow-hidden min-h-[200px]">
            <EditorHeader
              icon={<Code className="w-4 h-4 text-muted-foreground" />}
              title="SQL Editor"
              actions={
                <EditorActions
                  actions={[{
                    label: 'Выполнить',
                    icon: <Play className="w-4 h-4 mr-2" />, 
                    onClick: handleRunClick,
                    variant: 'default',
                  }]}
                  onReset={handleReset}
                />
              }
              className="bg-muted/20"
            />

            <div className="flex-1 relative min-h-0 h-full">
              <Editor
                height="100%"
                defaultLanguage="sql"
                value={sqlCode}
                onChange={(value) => setSqlCode(value || '')}
                onMount={handleEditorOnMount}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                loading={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Загрузка редактора...</div>}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  padding: { top: 16, bottom: 16 },
                }}
              />
            </div>
          </div>
        </ResizablePanel>
        
        <ResizableHandle />

        <ResizablePanel defaultSize={50} minSize={20}>
          <div className="h-full flex flex-col bg-background overflow-hidden">
            <div className="p-2 border-b bg-muted/20 flex items-center justify-between flex-shrink-0">
              <h3 className="text-sm font-medium">Результат</h3>
              {validationState && validationState !== 'idle' && (
                <div className={`flex items-center gap-2 text-xs px-2 py-1 rounded ${
                    validationState === 'success' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                }`}>
                    {validationState === 'success' ? 'Верно' : 'Ошибка'}
                </div>
              )}
            </div>
            
            {validationMessage && (
                <div className={`p-3 text-sm border-b ${
                    validationState === 'success' 
                      ? 'bg-green-50 text-green-900 dark:bg-green-900/20 dark:text-green-300' 
                      : 'bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300'
                }`}>
                    {validationMessage}
                </div>
            )}

            <div className="flex-1 overflow-auto">
              <SqlResultsTable results={result} />
            </div>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
