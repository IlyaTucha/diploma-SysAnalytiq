import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MessageSquare, XCircle, Trash2, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

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
  onApprove
}: ReviewCommentsPanelProps) {

  return (
    <div className="h-[300px] flex flex-col min-h-0 border rounded-lg overflow-hidden bg-background">
        <div className="p-4 border-b bg-muted/30 flex-shrink-0">
          <h3 className="font-medium">Комментарии</h3>
        </div>
        <div className="flex-1 flex flex-col min-h-0 p-4 overflow-y-auto space-y-4">
          <div>
            <h3 className="mb-2 text-sm font-medium">Общий комментарий</h3>
            <Textarea
              placeholder="Напишите общий комментарий к работе..."
              value={generalComment}
              onChange={(e) => setGeneralComment(e.target.value)}
              className="min-h-[100px]"
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
                    <Card key={comment.id} className="p-3 text-sm relative group hover:border-primary/50 transition-colors">
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
                        <p>{comment.text}</p>
                    </Card>
                  ))}
                </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t bg-muted/10 flex justify-center items-center flex-shrink-0 gap-2">
          <Button variant="outline" onClick={handleCloseReview}>
            Отмена
          </Button>
          <Button variant="outline" onClick={onReject} className="text-destructive hover:text-destructive">
            <XCircle className="w-4 h-4 mr-2" />
            Вернуть на доработку
          </Button>
          <Button onClick={onApprove} className="bg-success hover:bg-success/90 text-white">
            <CheckCircle className="w-4 h-4 mr-2" />
            Принять работу
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
import React from "react";
