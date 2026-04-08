import { useTheme } from '@/components/contexts/ThemeProvider';
import Editor, { OnMount } from '@monaco-editor/react';
import type { editor } from 'monaco-editor';
import { Code, Download } from 'lucide-react';
import { EditorActions } from '@/components/ui/EditorActions';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PlantUmlPreview } from './ui/PlantUmlPreview';
import { EditorHeader } from '@/components/ui/EditorHeader';
import { downloadPlantUml } from './internal/PlantUmlExport';
import { useRef, useCallback, useEffect } from 'react';

interface PlantUmlEditorPanelProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string | number;
  handleReset?: () => void;
  onMount?: (editor: any, monaco: any) => void;
}

export function PlantUmlEditorPanel({
  code,
  onChange,
  readOnly = false,
  height = "100%",
  handleReset,
  onMount: externalOnMount
}: PlantUmlEditorPanelProps) {
  const handleExport = () => downloadPlantUml(code);
  const { theme } = useTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const lastSentValue = useRef(code);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;

    // Listen to content changes and propagate to parent
    editor.onDidChangeModelContent(() => {
      const value = editor.getValue();
      lastSentValue.current = value;
      onChange(value);
    });

    if (externalOnMount) {
      externalOnMount(editor, monaco);
    }
  }, [onChange, externalOnMount]);

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

  return (
    <div className="h-full flex flex-col" style={{ height }}>
      <div className="flex-1 border rounded-lg overflow-hidden relative flex flex-col">
        <EditorHeader
          icon={<Code className="w-4 h-4 text-muted-foreground" />}
          title="PlantUML Editor"
          actions={
            !readOnly ? <EditorActions
              actions={[{
                label: 'Экспорт PNG',
                icon: <Download className="w-4 h-4 mr-2" />,
                onClick: handleExport,
                title: 'Экспорт PNG',
              }]}
              onReset={handleReset}
            /> : undefined
          }
          className="bg-muted/20"
        />
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={40} minSize={20}>
              <div className="h-full flex flex-col p-0">
                <Editor
                  height="100%"
                  defaultLanguage="java" // PlantUML syntax highlighting
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
                    readOnly: readOnly
                  }}
                />
              </div>
            </ResizablePanel>
            <ResizableHandle />
            <ResizablePanel defaultSize={60} minSize={20}>
              <PlantUmlPreview code={code} className="h-full w-full" />
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
