import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MessageSquare, Code, Calendar, User } from "lucide-react";
import { getNoun } from "@/components/ui/utils";
import { useData } from "@/lib/data";
import { MODULE_NAMES } from "@/const";
import { BpmnEditorPanel } from "@/components/editors/bpmn/BpmnEditorPanel";
import { PlantUmlEditorPanel } from "@/components/editors/plantuml/PlantUmlEditorPanel";
import { SwaggerEditorPanel } from "@/components/editors/swagger/SwaggerEditorPanel";
import { ErdEditorPanel } from "@/components/editors/erd/ErdEditorPanel";
import { ErdLayout } from '@/components/editors/erd/ErdDiagram';
import { SqlEditorPanel } from "@/components/editors/sql/SqlEditorPanel";

interface ReviewHistoryEntry {
  status: string;
  feedback: string;
  reviewerName?: string;
  reviewer_name?: string;
  reviewedAt?: string;
  reviewed_at?: string;
  inlineComments?: any[];
  inline_comments?: any[];
  studentSolution?: string;
  student_solution?: string;
  executionResult?: any;
  execution_result?: any;
}

interface ReviewHistoryDialogProps {
  entry: ReviewHistoryEntry | null;
  studentName: string;
  lessonTitle: string;
  moduleId?: number;
  onClose: () => void;
}

export function ReviewHistoryDialog({ entry, studentName, lessonTitle, moduleId, onClose }: ReviewHistoryDialogProps) {
  const { modules: modulesData } = useData();
  const moduleName = modulesData.find(m => m.id === moduleId)?.title || '';

  const reviewerName = entry?.reviewerName || entry?.reviewer_name || 'Преподаватель';
  const reviewedAt = entry?.reviewedAt || entry?.reviewed_at;
  const inlineComments = entry?.inlineComments || entry?.inline_comments || [];
  const studentSolution = entry?.studentSolution || entry?.student_solution || '';
  const executionResult = entry?.executionResult || entry?.execution_result || null;

  const isBpmn = moduleName === MODULE_NAMES.BPMN;
  const isPlantUml = moduleName === MODULE_NAMES.PLANTUML;
  const isSwagger = moduleName === MODULE_NAMES.SWAGGER;
  const isErd = moduleName === MODULE_NAMES.ERD;
  const isSql = moduleName === MODULE_NAMES.SQL;
  const hasVisualEditor = isBpmn || isPlantUml || isSwagger || isErd || isSql;

  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);
  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const commentsRef = useRef<HTMLDivElement>(null);

  // Scroll to and highlight targeted comment card
  useEffect(() => {
    if (!highlightedCommentId) return;
    const container = commentsRef.current;
    if (!container) return;
    const el = container.querySelector(`[data-comment-id="${highlightedCommentId}"]`) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('comment-card-highlight');
      const timer = setTimeout(() => {
        el.classList.remove('comment-card-highlight');
        setHighlightedCommentId(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightedCommentId]);

  if (!entry) return null;

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const noop = () => {};

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    editor.updateOptions({ glyphMargin: true });

    // Apply gutter decorations for inline comments
    if (inlineComments.length > 0) {
      const decos: any[] = [];
      inlineComments.forEach((c: any) => {
        const ls = c.line_start || c.lineStart;
        const le = c.line_end || c.lineEnd;
        const lineLabel = ls === le ? `Строка ${ls}` : `Строки ${ls}–${le}`;
        const commentText = (c.text || 'Комментарий к коду').replace(/\n/g, '\n\n');
        const hoverText = `**${lineLabel}**\n\n${commentText}`;
        // Glyph marker on first line only
        decos.push({
          range: new monaco.Range(ls, 1, ls, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: 'comment-glyph-marker',
            glyphMarginHoverMessage: { value: hoverText },
          }
        });
        // Yellow highlight on all lines
        decos.push({
          range: new monaco.Range(ls, 1, le, 1),
          options: {
            isWholeLine: true,
            className: 'comment-line-highlight',
          }
        });
      });
      decorationsRef.current = editor.deltaDecorations([], decos);
    }

    // Click on gutter glyph → scroll to comment
    editor.onMouseDown((e: any) => {
      if (e.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          const comment = inlineComments.find((c: any) => {
            const ls = c.line_start || c.lineStart;
            const le = c.line_end || c.lineEnd;
            return lineNumber >= ls && lineNumber <= le;
          });
          if (comment) {
            const id = comment.id || `comment-${inlineComments.indexOf(comment)}`;
            setHighlightedCommentId(id);
          }
        }
      }
    });
  };

  const renderSolutionEditor = () => {
    if (!studentSolution) return null;

    const editorHeight = "500px";

    if (isBpmn) {
      return (
        <BpmnEditorPanel
          bpmnCode={studentSolution}
          setBpmnCode={noop}
          readOnly={true}
          height={editorHeight}
          onMount={handleEditorDidMount}
        />
      );
    }

    if (isPlantUml) {
      return (
        <PlantUmlEditorPanel
          code={studentSolution}
          onChange={noop}
          readOnly={true}
          height={editorHeight}
          onMount={handleEditorDidMount}
        />
      );
    }

    if (isSwagger) {
      return (
        <SwaggerEditorPanel
          code={studentSolution}
          onChange={noop}
          readOnly={true}
          height={editorHeight}
          onMount={handleEditorDidMount}
        />
      );
    }

    if (isErd) {
      const savedLayout: ErdLayout | null = executionResult?.nodePositions
        ? executionResult as ErdLayout
        : null;
      return (
        <ErdEditorPanel
          code={studentSolution}
          onChange={noop}
          readOnly={true}
          height={editorHeight}
          onMount={handleEditorDidMount}
          initialLayout={savedLayout}
        />
      );
    }

    if (isSql) {
      return (
        <SqlEditorPanel
          sqlCode={studentSolution}
          setSqlCode={noop}
          result={Array.isArray(executionResult) ? executionResult : executionResult || null}
          readOnly={true}
          height={editorHeight}
          handleEditorDidMount={handleEditorDidMount}
        />
      );
    }

    // Fallback: code block
    return (
      <pre className="p-3 rounded-md bg-muted/50 text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-[400px] overflow-y-auto border">
        {studentSolution}
      </pre>
    );
  };

  return (
    <Dialog open={!!entry} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-[90vw] w-[1100px] max-h-[90vh] overflow-hidden flex flex-col p-0" aria-describedby={undefined}>
        <DialogTitle className="sr-only">История проверки</DialogTitle>
        <div className="p-6 border-b bg-muted/30 flex-shrink-0">
          <div className="flex items-center gap-3 mb-2">
            {entry.status === 'approved' ? (
              <Badge className="bg-success text-success-foreground">Принято</Badge>
            ) : (
              <Badge variant="destructive">На доработке</Badge>
            )}
            <span className="text-sm text-muted-foreground">{lessonTitle}</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              <span>Студент: {studentName}</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Проверил: {reviewerName}</span>
            </div>
            {reviewedAt && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(reviewedAt)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 flex flex-col min-h-0 overflow-auto">
          {/* Solution editor — same panels as first review */}
          {studentSolution && hasVisualEditor && (
            <div className="px-6 pt-3 flex-shrink-0">
              {renderSolutionEditor()}
            </div>
          )}

          {studentSolution && !hasVisualEditor && (
            <div className="px-6 pt-3">
              <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                <Code className="w-4 h-4" />
                Решение студента
              </h3>
              {renderSolutionEditor()}
            </div>
          )}

          {/* Feedback and comments */}
          <div ref={commentsRef} className="px-6 pt-3 pb-6 space-y-4">
            {entry.feedback && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Общий комментарий
                </h3>
                <div className="p-3 rounded-md bg-muted/50 text-sm whitespace-pre-wrap">
                  {entry.feedback}
                </div>
              </div>
            )}

            {inlineComments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Code className="w-4 h-4" />
                  {inlineComments.length} {getNoun(inlineComments.length, 'комментарий', 'комментария', 'комментариев')} к коду
                </h3>
                <div className="space-y-2">
                  {inlineComments.map((c: any, idx: number) => {
                    const ls = c.line_start || c.lineStart;
                    const le = c.line_end || c.lineEnd;
                    return (
                      <div key={idx} data-comment-id={c.id || `comment-${idx}`} className="p-3 rounded-md border bg-background text-sm transition-all">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                            {ls && le ? (ls === le ? `Строка ${ls}` : `Строки ${ls}–${le}`) : '—'}
                          </span>
                        </div>
                        {(c.highlighted_text || c.highlightedText) && (
                          <code className="block mb-2 px-2 py-1 bg-muted rounded text-xs line-clamp-4 border-l-2 border-primary/30">
                            {c.highlighted_text || c.highlightedText}
                          </code>
                        )}
                        {c.text && <p className="text-sm whitespace-pre-wrap">{c.text}</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {!entry.feedback && inlineComments.length === 0 && (
              <div className="text-center text-muted-foreground py-4">
                Нет комментариев к этой проверке
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
