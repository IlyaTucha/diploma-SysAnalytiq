import { useTheme } from '@/components/contexts/ThemeProvider';
import Editor from '@monaco-editor/react';
import { FileText, Download } from 'lucide-react';
import { EditorActions } from '@/components/ui/EditorActions';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { EditorHeader } from '@/components/ui/EditorHeader';
import { SwaggerPreview } from './ui/SwaggerPreview';
import { useSwaggerExport } from './internal/swaggerExport';

interface SwaggerEditorPanelProps {
  code: string;
  onChange: (code: string) => void;
  readOnly?: boolean;
  height?: string | number;
  handleReset?: () => void;
  onMount?: (editor: any, monaco: any) => void;
}

export function SwaggerEditorPanel({
  code,
  onChange,
  readOnly = false,
  height = "100%",
  handleReset,
  onMount
}: SwaggerEditorPanelProps) {
  const { theme } = useTheme();
  const { handleExport } = useSwaggerExport();

  return (
    <div className="h-full flex flex-col" style={{ height }}>
      <div className="flex-1 border rounded-lg overflow-hidden relative flex flex-col">
        <EditorHeader
          icon={<FileText className="w-4 h-4 text-muted-foreground" />}
          title="Swagger Editor"
          actions={
            !readOnly ? <EditorActions
              actions={[{
                label: 'Экспорт YAML',
                icon: <Download className="w-4 h-4 mr-2" />, 
                onClick: () => handleExport(code),
                title: 'Экспорт YAML',
              }]}
              onReset={handleReset}
            /> : undefined
          }
          className="bg-muted/20"
        />
        <div className="flex-1 min-h-0">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            <ResizablePanel defaultSize={50} minSize={20} className="h-full">
              <div className="h-full flex flex-col">
                <Editor
                  height="100%"
                  defaultLanguage="yaml"
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
            <ResizablePanel defaultSize={50} minSize={20} className="h-full">
              <div className="h-full flex flex-col">
                  <SwaggerPreview code={code} />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </div>
    </div>
  );
}
