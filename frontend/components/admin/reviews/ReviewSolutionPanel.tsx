import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { MODULE_NAMES } from "@/const";
import { BpmnEditorPanel } from "@/components/editors/bpmn/BpmnEditorPanel";
import { PlantUmlEditorPanel } from "@/components/editors/plantuml/PlantUmlEditorPanel";
import { SwaggerEditorPanel } from "@/components/editors/swagger/SwaggerEditorPanel";
import { SqlResultsTable } from "@/components/editors/sql/ui/SqlResultsTable";
import Editor from "@monaco-editor/react";

interface ReviewSolutionPanelProps {
  reviewingSubmission: any;
  handleEditorDidMount: (editor: any, monaco: any) => void;
  theme: string;
  moduleName: string;
}

export function ReviewSolutionPanel({ reviewingSubmission, handleEditorDidMount, theme, moduleName }: ReviewSolutionPanelProps) {
  const isBpmn = moduleName === MODULE_NAMES.BPMN;
  const isPlantUml = moduleName === MODULE_NAMES.PLANTUML;
  const isSwagger = moduleName === MODULE_NAMES.SWAGGER;
  const isErd = moduleName === MODULE_NAMES.ERD;
  const isSql = moduleName === MODULE_NAMES.SQL;

  const renderEditor = () => {
    if (isBpmn) {
      return (
        <BpmnEditorPanel 
          bpmnCode={reviewingSubmission.studentSolution} 
          setBpmnCode={() => {}} 
          readOnly={true} 
          height="100%"
          onMount={handleEditorDidMount}
        />
      );
    }

    if (isPlantUml) {
      return (
        <PlantUmlEditorPanel 
          code={reviewingSubmission.studentSolution} 
          onChange={() => {}} 
          readOnly={true} 
          height="100%"
          onMount={handleEditorDidMount}
        />
      );
    }

    if (isSwagger) {
      return (
        <SwaggerEditorPanel 
          code={reviewingSubmission.studentSolution} 
          onChange={() => {}} 
          readOnly={true} 
          height="100%"
          onMount={handleEditorDidMount}
        />
      );
    }

    if (isErd) {
      return (
        <div className="flex flex-col h-full">
            <div className="flex-1 min-h-0">
                <Editor
                height="100%"
                defaultLanguage="apex"
                value={reviewingSubmission.studentSolution}
                onMount={handleEditorDidMount}
                loading={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Загрузка редактора...</div>}
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    fontSize: 14,
                    contextmenu: true,
                }}
                theme={theme === 'dark' ? 'vs-dark' : 'light'}
                />
            </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0">
              <Editor
              height="100%"
              defaultLanguage="sql"
              value={reviewingSubmission.studentSolution}
              onMount={handleEditorDidMount}
              loading={<div className="flex items-center justify-center h-full text-muted-foreground text-sm">Загрузка редактора...</div>}
              options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  scrollBeyondLastLine: false,
                  fontSize: 14,
                  contextmenu: true,
              }}
              theme={theme === 'dark' ? 'vs-dark' : 'light'}
              />
          </div>
          <div className="h-[150px] border-t bg-muted/10 p-2 overflow-auto font-mono text-sm">
              <div className="text-xs text-muted-foreground mb-1">Результат выполнения:</div>
              {isSql && Array.isArray(reviewingSubmission.executionResult) ? (
                 <SqlResultsTable results={reviewingSubmission.executionResult} />
              ) : reviewingSubmission.executionResult ? (
                 <pre>{JSON.stringify(reviewingSubmission.executionResult, null, 2)}</pre>
              ) : (
                <div className="text-muted-foreground italic">Нет данных о выполнении</div>
              )}
          </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col min-h-0 border rounded-lg overflow-hidden bg-background">
       <div className="p-4 border-b bg-muted/30 flex justify-between items-center flex-shrink-0">
          <h3 className="font-medium">Решение студента</h3>
          <Badge className="bg-success text-success-foreground">
              <CheckCircle className="w-3 h-3 mr-1" />
              Базовые проверки пройдены
          </Badge>
       </div>
       <div className="flex-1 relative min-h-0">
          {renderEditor()}
       </div>
    </div>
  );
}
