import { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import Editor from '@monaco-editor/react';
import { Code, Workflow, LayoutTemplate,  Undo, Redo, Maximize, Upload, Download, Image } from 'lucide-react';
import { EditorActions } from '@/components/ui/EditorActions';
import { Card } from '@/components/ui/card';
import { BpmnEditor, BpmnEditorRef } from './BpmnEditor';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EditorHeader } from '@/components/ui/EditorHeader';
import { downloadBpmn, downloadBpmnSvg } from './internal/BpmnExport';

interface BpmnEditorPanelProps {
  bpmnCode: string;
  setBpmnCode: (code: string) => void;
  handleReset?: () => void;
  readOnly?: boolean;
  height?: string | number;
  onMount?: (editor: any, monaco: any) => void;
}

export function BpmnEditorPanel({
  bpmnCode,
  setBpmnCode,
  handleReset,
  readOnly = false,
  height = "100%",
  onMount
}: BpmnEditorPanelProps) {
  const { theme } = useTheme();
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');
  const editorRef = useRef<BpmnEditorRef>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [history, setHistory] = useState<string[]>([bpmnCode]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const isUndoing = useRef(false);
  const isResetting = useRef(false);
  
  const lastVisualCode = useRef(bpmnCode);
  if (viewMode === 'visual') {
    lastVisualCode.current = bpmnCode;
  }

  const [editorKey, setEditorKey] = useState(0);
  const handleDownload = () => downloadBpmn(bpmnCode);
  const handleDownloadSvg = () => downloadBpmnSvg(editorRef.current);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setBpmnCode(content);
        // Clear value to allow re-uploading the same file
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
      };
      reader.readAsText(file);
    }
  };

  const handleCodeChange = (newCode: string) => {
    setBpmnCode(newCode);
  };

  const undo = () => {
    if (currentIndex > 0) {
      isUndoing.current = true;
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setBpmnCode(history[newIndex]);
    }
  };

  const redo = () => {
    if (currentIndex < history.length - 1) {
      isUndoing.current = true;
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setBpmnCode(history[newIndex]);
    }
  };

  const onReset = () => {
    if (handleReset) {
      isResetting.current = true;
      handleReset();
      setEditorKey(prev => prev + 1);
    }
  };

  useEffect(() => {
    if (isUndoing.current) {
      isUndoing.current = false;
      return;
    }

    if (isResetting.current) {
      setHistory([bpmnCode]);
      setCurrentIndex(0);
      isResetting.current = false;
      return;
    }
    
    if (bpmnCode !== history[currentIndex]) {
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(bpmnCode);
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bpmnCode]);

  const commonLeftButtons = [
    {
      label: '',
      icon: <Undo className="w-4 h-4" />, 
      onClick: undo,
      disabled: currentIndex <= 0,
      title: 'Отменить',
    },
    {
      label: '',
      icon: <Redo className="w-4 h-4" />, 
      onClick: redo,
      disabled: currentIndex >= history.length - 1,
      title: 'Повторить',
    }
  ];

  const visualButtons = [
    {
      label: 'Центрировать',
      icon: <Maximize className="w-4 h-4 mr-2" />, 
      onClick: () => editorRef.current?.center(),
      title: 'Центрировать',
    },
  ];

  const leftButtons = (viewMode === 'visual' && !readOnly)
    ? [...commonLeftButtons, ...visualButtons]
    : (readOnly ? [] : commonLeftButtons);

  const rightButtons = (viewMode === 'visual' && !readOnly) ? [
    {
      label: 'Импорт BPMN',
      icon: <Upload className="w-4 h-4 mr-2" />, 
      onClick: () => fileInputRef.current?.click(),
      title: 'Импорт BPMN',
    },
    {
      label: 'Экспорт BPMN',
      icon: <Download className="w-4 h-4 mr-2" />, 
      onClick: handleDownload,
      title: 'Экспорт BPMN',
    },
    {
      label: 'Экспорт SVG',
      icon: <Image className="w-4 h-4 mr-2" />, 
      onClick: handleDownloadSvg,
      title: 'Экспорт SVG',
    },
  ] : [];

  return (
    <div className="h-full flex flex-col border rounded-xl overflow-hidden" style={{ height }}>
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".bpmn,.xml"
        onChange={handleFileUpload}
      />
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="flex-1 flex flex-col min-h-0 h-full">
        <EditorHeader
          icon={<Workflow className="h-4 w-4" />}
          title="BPMN Editor"
          leftActions={
            !readOnly ? <EditorActions
              actions={leftButtons}
            /> : undefined
          }
          rightActions={
            !readOnly ? <EditorActions
              actions={rightButtons}
              onReset={handleReset ? onReset : undefined}
            /> : undefined
          }
          className="bg-muted/20 border-b rounded-t-none"
        />
        <TabsList className="bg-muted text-muted-foreground dark:bg-zinc-900 dark:text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-xl p-[3px] mt-0 mb-2">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <LayoutTemplate className="h-4 w-4" />
            Графический
          </TabsTrigger>
          <TabsTrigger value="code" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            XML
          </TabsTrigger>
        </TabsList>

        <Card className="rounded-xl overflow-hidden flex flex-col flex-1 min-h-0 h-full">
          <div className={viewMode === 'code' ? 'flex flex-col h-full min-h-0' : 'hidden'}>
            <div className="flex-1 relative min-h-0 flex flex-col h-full">
              <Editor
                height="100%"
                defaultLanguage="xml"
                value={bpmnCode}
                onChange={(value) => handleCodeChange(value || '')}
                onMount={onMount}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                loading={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Загрузка редактора...</div>}
                options={{
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  readOnly: readOnly
                }}
              />
            </div>
          </div>

          <div className={viewMode === 'visual' ? 'flex flex-col h-full min-h-0' : 'hidden'}>
            <div className="flex-1 relative bg-white overflow-hidden h-full min-h-0 flex flex-col">
              <BpmnEditor
                key={editorKey}
                ref={editorRef}
                code={lastVisualCode.current}
                onChange={handleCodeChange}
                className="h-full w-full flex-1"
                readOnly={readOnly}
              />
            </div>
          </div>
        </Card>
      </Tabs>
    </div>
  );
}
