import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";
import { MODULE_NAMES } from "@/const";
import { BpmnEditorPanel } from "@/components/editors/bpmn/BpmnEditorPanel";
import { PlantUmlEditorPanel } from "@/components/editors/plantuml/PlantUmlEditorPanel";
import { SwaggerEditorPanel } from "@/components/editors/swagger/SwaggerEditorPanel";
import { SqlEditorPanel } from "@/components/editors/sql/SqlEditorPanel";
import { ErdEditorPanel } from "@/components/editors/erd/ErdEditorPanel";
import { ErdLayout } from "@/components/editors/erd/ErdDiagram";

interface ReviewSolutionPanelProps {
  reviewingSubmission: any;
  handleEditorDidMount: (editor: any, monaco: any) => void;
  theme?: string;
  moduleName: string;
}

export function ReviewSolutionPanel({ reviewingSubmission, handleEditorDidMount, moduleName }: ReviewSolutionPanelProps) {
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
      const savedLayout: ErdLayout | null = reviewingSubmission.executionResult?.nodePositions
        ? reviewingSubmission.executionResult as ErdLayout
        : null;
      return (
        <ErdEditorPanel 
          code={reviewingSubmission.studentSolution} 
          onChange={() => {}} 
          readOnly={true} 
          height="100%"
          onMount={handleEditorDidMount}
          initialLayout={savedLayout}
        />
      );
    }

    return (
      <SqlEditorPanel
        sqlCode={reviewingSubmission.studentSolution}
        setSqlCode={() => {}}
        result={isSql && Array.isArray(reviewingSubmission.executionResult) ? reviewingSubmission.executionResult : reviewingSubmission.executionResult || null}
        readOnly={true}
        height="100%"
        handleEditorDidMount={handleEditorDidMount}
      />
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
