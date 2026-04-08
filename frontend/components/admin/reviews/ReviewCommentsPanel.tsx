import React, { useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, XCircle, Trash2, CheckCircle, Bot } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

function AutoResizeTextarea({ value, onChange, placeholder, className }: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxHeight = 400;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(Math.max(150, textarea.scrollHeight), maxHeight);
      textarea.style.height = `${newHeight}px`;
      textarea.style.overflowY = textarea.scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`flex w-full rounded-md bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[150px] ${className || ''}`}
      style={{ resize: 'none', border: '1px solid #888' }}
    />
  );
}

interface Comment {
  id: string;
  lineStart: number;
  lineEnd: number;
  text: string;
  highlightedText: string;
}

interface ReviewCommentsPanelProps {
  generalComment: string;
  setGeneralComment: (comment: string) => void;
  activeSelection: { text: string; lineStart: number; lineEnd: number } | null;
  setActiveSelection: (selection: { text: string; lineStart: number; lineEnd: number } | null) => void;
  inlineComments: Comment[];
  setInlineComments: (comments: Comment[] | ((prev: Comment[]) => Comment[])) => void;
  handleRemoveInlineComment: (id: string) => void;
  handleCloseReview: () => void;
  onReject: () => void;
  onApprove: () => void;
  onAiCheck: () => void;
  aiCheckLoading?: boolean;
  highlightedCommentId?: string | null;
  setHighlightedCommentId?: (id: string | null) => void;
}

export function ReviewCommentsPanel({
  generalComment,
  setGeneralComment,
  activeSelection,
  setActiveSelection,
  inlineComments,
  setInlineComments,
  handleRemoveInlineComment,
  handleCloseReview,
  onReject,
  onApprove,
  onAiCheck,
  aiCheckLoading,
  highlightedCommentId,
  setHighlightedCommentId,
}: ReviewCommentsPanelProps) {
  const commentsScrollRef = useRef<HTMLDivElement>(null);

  // Scroll to and highlight the targeted comment card
  useEffect(() => {
    if (!highlightedCommentId) return;
    const container = commentsScrollRef.current;
    if (!container) return;

    const el = container.querySelector(`[data-comment-id="${highlightedCommentId}"]`) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('comment-card-highlight');
      const timer = setTimeout(() => {
        el.classList.remove('comment-card-highlight');
        setHighlightedCommentId?.(null);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [highlightedCommentId, setHighlightedCommentId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 border rounded-lg overflow-hidden bg-background">
        <div className="p-4 border-b bg-muted/30 flex-shrink-0">
          <h3 className="font-medium">Комментарии</h3>
        </div>
        <div ref={commentsScrollRef} className="flex-1 flex flex-col min-h-0 p-4 overflow-y-auto space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Общий комментарий</h3>
            <AutoResizeTextarea
              placeholder="Напишите общий комментарий к работе..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
            />
          </div>

          {activeSelection && (
            <div className="bg-muted/50 border border-primary/20 rounded-lg p-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-primary flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        Новый комментарий
                    </h3>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setActiveSelection(null)}>
                        <XCircle className="w-4 h-4" />
                    </Button>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                    {activeSelection.lineStart === activeSelection.lineEnd 
                        ? `Строка ${activeSelection.lineStart}`
                        : `Строки ${activeSelection.lineStart}-${activeSelection.lineEnd}`
                    }
                </div>
                <code className="block bg-background p-2 rounded text-xs mb-2 max-h-20 overflow-y-auto border">
                    {activeSelection.text}
                </code>
                
                <NewCommentInput 
                    onAdd={(text) => {
                        const newComment: Comment = {
                            id: crypto.randomUUID(),
                            lineStart: activeSelection.lineStart,
                            lineEnd: activeSelection.lineEnd,
                            text: text,
                            highlightedText: activeSelection.text
                        };
                        setInlineComments((prev) => [...prev, newComment]);
                        setActiveSelection(null);
                    }} 
                />
            </div>
          )}

          {inlineComments.length > 0 && (
            <div>
                <h3 className="mb-2 text-sm font-medium">Комментарии к коду ({inlineComments.length})</h3>
                <div className="space-y-3">
                  {inlineComments.map((comment) => (
                    <Card key={comment.id} data-comment-id={comment.id} className="p-3 text-sm relative group hover:border-primary/50 transition-colors">
                        <div className="flex justify-between items-start gap-2 mb-1">
                            <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                                {comment.lineStart === comment.lineEnd ? `Строка ${comment.lineStart}` : `Строки ${comment.lineStart}-${comment.lineEnd}`}
                            </span>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                                onClick={() => handleRemoveInlineComment(comment.id)}
                            >
                                <Trash2 className="w-3 h-3" />
                            </Button>
                        </div>
                        <div className="text-xs text-muted-foreground mb-2 line-clamp-2 border-l-2 pl-2 italic">
                            {comment.highlightedText}
                        </div>
                        <p className="whitespace-pre-wrap">{comment.text}</p>
                    </Card>
                  ))}
                </div>
            </div>
          )}
        </div>
        <div className="px-6 py-4 border-t bg-muted/10 flex flex-wrap justify-center items-center flex-shrink-0 gap-2">
          <Button variant="outline" size="sm" onClick={handleCloseReview}>
            Отмена
          </Button>
          <Button variant="outline" size="sm" onClick={onReject} className="text-destructive hover:text-destructive">
            <XCircle className="w-4 h-4 mr-1.5" />
            На доработку
          </Button>
          <Button size="sm" onClick={onApprove} className="bg-success hover:bg-success/90 text-white">
            <CheckCircle className="w-4 h-4 mr-1.5" />
            Принять работу
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:border-blue-500 dark:text-blue-400 dark:hover:bg-blue-950 dark:hover:text-blue-300"
            onClick={onAiCheck}
            disabled={aiCheckLoading}
          >
            <Bot className={`w-4 h-4 mr-1.5${aiCheckLoading ? ' animate-spin' : ''}`} />
            {aiCheckLoading ? 'Проверка...' : 'ИИ проверка'}
          </Button>
        </div>
    </div>
  );
}

function NewCommentInput({ onAdd }: { onAdd: (text: string) => void }) {
    const [val, setVal] = React.useState('');
    const handleAdd = () => {
        if (val.trim()) {
            onAdd(val);
            setVal('');
        }
    };
    return (
        <>
            <Textarea
                placeholder="Введите комментарий к выделенному коду..."
                className="mb-2 text-sm"
                autoFocus
                value={val}
                onChange={e => setVal(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        handleAdd();
                    }
                }}
            />
            <div className="flex justify-end">
                <Button size="sm" onClick={handleAdd}>
                    Добавить
                </Button>
            </div>
        </>
    )
}
