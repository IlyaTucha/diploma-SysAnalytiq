import { useTheme } from '@/components/contexts/ThemeProvider';
import { useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Code, Download } from 'lucide-react';
import { EditorActions } from '@/components/ui/EditorActions';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { PlantUmlPreview } from './ui/PlantUmlPreview';
import { EditorHeader } from '@/components/ui/EditorHeader';
import { downloadPlantUml } from './internal/PlantUmlExport';

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
  onMount
}: PlantUmlEditorPanelProps) {
  const handleExport = () => downloadPlantUml(code);
  const { theme } = useTheme();

  const previewKey = useMemo(() => code, [code]);

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
                  value={code}
                  onChange={(value) => onChange(value || '')}
                  onMount={onMount}
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
              <div className="p-0 block" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                <PlantUmlPreview code={code} key={previewKey} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
