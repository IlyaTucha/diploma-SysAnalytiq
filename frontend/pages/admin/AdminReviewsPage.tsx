import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from "sonner";
import { Bell } from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { Submission } from '@/types/submission';
import { Comment } from '@/types/comment';
import { useData } from '@/lib/data';
import { adminApi, groupsApi, getAccessToken } from '@/lib/api';
import { ReviewList } from '@/components/admin/reviews/ReviewList';
import { ReviewDialog } from '@/components/admin/reviews/ReviewDialog';
import { moduleOrder } from '@/const';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Group } from '@/types/group';

export default function AdminReviews() {
  const { getThemeColor, theme } = useTheme();
  const { modules: modulesData } = useData();
  const [openModules, setOpenModules] = useState<number[]>([]);
  const [reviewingSubmission, setReviewingSubmission] = useState<Submission | null>(null);
  const [generalComment, setGeneralComment] = useState('');
  const [inlineComments, setInlineComments] = useState<Comment[]>([]);
  const [activeSelection, setActiveSelection] = useState<{
    text: string;
    lineStart: number;
    lineEnd: number;
  } | null>(null);
  const [aiCheckLoading, setAiCheckLoading] = useState(false);
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  const editorRef = useRef<any>(null);
  const monacoRef = useRef<any>(null);
  const decorationsRef = useRef<string[]>([]);
  const inlineCommentsRef = useRef<Comment[]>(inlineComments);

  useEffect(() => {
    inlineCommentsRef.current = inlineComments;
  }, [inlineComments]);

  // Update gutter decorations when inline comments change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations: any[] = [];
    inlineComments.forEach(c => {
      const lineLabel = c.lineStart === c.lineEnd
        ? `Строка ${c.lineStart}`
        : `Строки ${c.lineStart}–${c.lineEnd}`;
      const commentText = (c.text || 'Комментарий к коду').replace(/\n/g, '\n\n');
      const hoverText = `**${lineLabel}**\n\n${commentText}`;
      // Glyph marker on first line only
      newDecorations.push({
        range: new monaco.Range(c.lineStart, 1, c.lineStart, 1),
        options: {
          isWholeLine: false,
          glyphMarginClassName: 'comment-glyph-marker',
          glyphMarginHoverMessage: { value: hoverText },
        }
      });
      // Yellow highlight on all lines of the comment
      newDecorations.push({
        range: new monaco.Range(c.lineStart, 1, c.lineEnd, 1),
        options: {
          isWholeLine: true,
          className: 'comment-line-highlight',
        }
      });
    });

    decorationsRef.current = editor.deltaDecorations(decorationsRef.current, newDecorations);
  }, [inlineComments]);

  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const loadSubmissions = useCallback(() => {
    adminApi.submissions().then((data) => {
      setSubmissions(data as unknown as Submission[]);
      window.dispatchEvent(new Event('reviews-updated'));
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!getAccessToken()) return;
    loadSubmissions();
    groupsApi.list().then((data) => setGroups(data as unknown as Group[])).catch(() => {});
    const interval = setInterval(() => {
      if (getAccessToken()) loadSubmissions();
    }, 30000);
    return () => clearInterval(interval);
  }, [loadSubmissions]);

  const filteredSubmissions = submissions.filter(s => {
    // Не показываем работы пользователей без группы
    if (!s.studentGroupId) return false;
    if (selectedGroup === 'all') return true;
    const group = groups.find(g => g.id === s.studentGroupId);
    return group?.name === selectedGroup;
  });

  const groupedSubmissions = filteredSubmissions.reduce((acc, submission) => {
    if (!acc[submission.moduleId]) {
      acc[submission.moduleId] = [];
    }
    acc[submission.moduleId].push(submission);
    return acc;
  }, {} as Record<number, Submission[]>);
  
  Object.keys(groupedSubmissions).forEach(moduleId => {
    groupedSubmissions[Number(moduleId)].sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (a.status !== 'pending' && b.status === 'pending') return 1;
        return new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime();
    });
  });

  // сортировка модулей в определенном порядке
  const sortedModules = [...modulesData].sort((a, b) => {
      const indexA = moduleOrder.indexOf(a.slug);
      const indexB = moduleOrder.indexOf(b.slug);
      return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB);
  });

  const toggleModule = (moduleId: number) => {
    setOpenModules((prev) =>
      prev.includes(moduleId)
        ? prev.filter((id) => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const handleOpenReview = (submission: Submission) => {
    setReviewingSubmission(submission);
    setGeneralComment(submission.comments || '');
    setInlineComments(submission.inlineComments || []);
  };

  const handleCloseReview = () => {
    setReviewingSubmission(null);
    setGeneralComment('');
    setInlineComments([]);
    setActiveSelection(null);
    setHighlightedCommentId(null);
    editorRef.current = null;
    monacoRef.current = null;
    decorationsRef.current = [];
  };

  const handleRemoveInlineComment = (commentId: string) => {
    setInlineComments(inlineComments.filter(c => c.id !== commentId));
    toast.success('Комментарий удален');
  };

  const handleEditorDidMount = (editor: any, _monaco: any) => {
    editorRef.current = editor;
    monacoRef.current = _monaco;

    // Enable glyph margin for comment markers
    editor.updateOptions({ glyphMargin: true });

    // Apply initial decorations for already-existing comments
    const currentComments = inlineCommentsRef.current;
    if (currentComments.length > 0) {
      const initDecos: any[] = [];
      currentComments.forEach((c: Comment) => {
        const lineLabel = c.lineStart === c.lineEnd
          ? `Строка ${c.lineStart}`
          : `Строки ${c.lineStart}–${c.lineEnd}`;
        const commentText = (c.text || 'Комментарий к коду').replace(/\n/g, '\n\n');
        const hoverText = `**${lineLabel}**\n\n${commentText}`;
        initDecos.push({
          range: new _monaco.Range(c.lineStart, 1, c.lineStart, 1),
          options: {
            isWholeLine: false,
            glyphMarginClassName: 'comment-glyph-marker',
            glyphMarginHoverMessage: { value: hoverText },
          }
        });
        initDecos.push({
          range: new _monaco.Range(c.lineStart, 1, c.lineEnd, 1),
          options: {
            isWholeLine: true,
            className: 'comment-line-highlight',
          }
        });
      });
      decorationsRef.current = editor.deltaDecorations([], initDecos);
    }

    // Click on gutter glyph → scroll to comment in panel
    editor.onMouseDown((e: any) => {
      if (e.target.type === _monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN) {
        const lineNumber = e.target.position?.lineNumber;
        if (lineNumber) {
          const comment = inlineCommentsRef.current.find(
            (c: Comment) => lineNumber >= c.lineStart && lineNumber <= c.lineEnd
          );
          if (comment) {
            setHighlightedCommentId(comment.id);
          }
        }
      }
    });

    editor.onDidChangeCursorSelection((_e: any) => {
        const selection = editor.getSelection();
        if (selection && !selection.isEmpty()) {
            const model = editor.getModel();
            const text = model.getValueInRange(selection);
            setActiveSelection({
                text,
                lineStart: selection.startLineNumber,
                lineEnd: selection.endLineNumber
            });
        } else {
            setActiveSelection(null);
        }
    });

    editor.addAction({
      id: 'add-comment',
      label: 'Добавить комментарий',
      contextMenuGroupId: 'navigation',
      run: (ed: any) => {
        const selection = ed.getSelection();
        if (selection && !selection.isEmpty()) {
          const model = ed.getModel();
          const text = model.getValueInRange(selection);
          const newComment: Comment = {
            id: Date.now().toString(),
            lineStart: selection.startLineNumber,
            lineEnd: selection.endLineNumber,
            text: '', 
            highlightedText: text
          };
          setInlineComments(prev => [...prev, newComment]);
          setActiveSelection(null);
          toast.success('Комментарий добавлен.');
        }
      }
    });
  };

  const handleApprove = async () => {
    if (!reviewingSubmission) return;
    try {
      await adminApi.review(reviewingSubmission.id, {
        status: 'approved',
        feedback: generalComment,
        inline_comments: inlineComments.map(c => ({
          line_start: c.lineStart,
          line_end: c.lineEnd,
          text: c.text,
          highlighted_text: c.highlightedText,
        })),
      });
      setSubmissions(prev => prev.map(s => 
        s.id === reviewingSubmission.id 
          ? { ...s, status: 'approved', comments: generalComment, inlineComments: inlineComments }
          : s
      ));
      loadSubmissions();
      window.dispatchEvent(new Event('reviews-updated'));
      toast.success('Работа принята!');
      handleCloseReview();
    } catch {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleReject = async () => {
    if (!generalComment.trim() && inlineComments.length === 0) {
      toast.error('Пожалуйста, укажите, что нужно исправить');
      return;
    }
    if (!reviewingSubmission) return;
    try {
      await adminApi.review(reviewingSubmission.id, {
        status: 'rejected',
        feedback: generalComment,
        inline_comments: inlineComments.map(c => ({
          line_start: c.lineStart,
          line_end: c.lineEnd,
          text: c.text,
          highlighted_text: c.highlightedText,
        })),
      });
      setSubmissions(prev => prev.map(s => 
        s.id === reviewingSubmission.id 
          ? { ...s, status: 'rejected', comments: generalComment, inlineComments: inlineComments }
          : s
      ));
      loadSubmissions();
      window.dispatchEvent(new Event('reviews-updated'));
      toast.success('Работа отправлена на доработку');
      handleCloseReview();
    } catch {
      toast.error('Ошибка при сохранении');
    }
  };

  const handleAiCheck = async () => {
    if (!reviewingSubmission) return;
    setAiCheckLoading(true);
    try {
      const result = await adminApi.aiCheck(reviewingSubmission.id);
      if (result.error) {
        toast.error(result.error);
        return;
      }

      // Добавляем построчные комментарии от ИИ
      let inlineAdded = 0;
      if (result.issues && Array.isArray(result.issues) && result.issues.length > 0) {
        const aiInline = result.issues
          .filter((c: any) => (c.lineStart || c.line_start) && (c.problem || c.fix || c.suggestion))
          .map((c: any) => {
            const problem = c.problem || '';
            const fix = c.fix || c.suggestion || '';
            const codeFragment = c.codeFragment || c.code_fragment || '';
            const severity = c.severity || 'error';

            // Формируем текст комментария с учётом severity
            let commentText = '';
            const severityLabel = severity === 'suggestion' ? 'Рекомендация'
              : severity === 'warning' ? 'Замечание'
              : 'Ошибка';

            if (problem && fix) {
              commentText = `${severityLabel}: ${problem}\n\nЧто нужно исправить: ${fix}`;
            } else if (problem) {
              commentText = `${severityLabel}: ${problem}`;
            } else if (fix) {
              commentText = `Что нужно исправить: ${fix}`;
            }

            return {
              id: crypto.randomUUID(),
              lineStart: c.lineStart || c.line_start,
              lineEnd: c.lineEnd || c.line_end || c.lineStart || c.line_start,
              text: commentText,
              highlightedText: codeFragment,
              severity,
            };
          });
        if (aiInline.length > 0) {
          setInlineComments(prev => [...prev, ...aiInline]);
          inlineAdded = aiInline.length;
        }
      }

      // Формируем общий комментарий
      const parts: string[] = [];

      // Вердикт
      if (result.verdict) {
        parts.push(result.verdict);
      }

      // Невыполненные требования
      const missingReqs = result.missingRequirements || result.missing_requirements;
      if (missingReqs && missingReqs.length > 0) {
        parts.push('\nНе выполнено:');
        missingReqs.forEach((req: string) => {
          parts.push(`• ${req}`);
        });
      }

      // Плагиат
      const plagiarism = result.plagiarism;
      if (plagiarism?.detected) {
        const similarTo = plagiarism.similarTo || plagiarism.similar_to;
        parts.push(`\n⚠️ Обнаружено сходство с решением #${similarTo}`);
        if (plagiarism.fragments?.length) {
          parts.push(`Фрагменты: ${plagiarism.fragments.join(', ')}`);
        }
      }

      const aiComment = parts.join('\n');
      if (aiComment.trim()) {
        setGeneralComment(prev => prev ? `${prev}\n\n${aiComment}` : aiComment);
      }

      if (inlineAdded > 0) {
        toast.success(`ИИ проверка: ${inlineAdded} комментариев к коду`);
      } else {
        toast.success('ИИ проверка завершена');
      }
    } catch {
      toast.error('Ошибка при ИИ проверке');
    } finally {
      setAiCheckLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
              <h1>Проверка заданий</h1>
            </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="space-y-6">
            <div className="w-[200px]">
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Выберите группу" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все группы</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.name}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ReviewList 
                sortedModules={sortedModules}
                groupedSubmissions={groupedSubmissions}
                openModules={openModules}
                toggleModule={toggleModule}
                handleOpenReview={handleOpenReview}
                groups={groups}
              />
          </div>

          <ReviewDialog 
            reviewingSubmission={reviewingSubmission}
            handleCloseReview={handleCloseReview}
            generalComment={generalComment}
            setGeneralComment={setGeneralComment}
            inlineComments={inlineComments}
            setInlineComments={setInlineComments}
            activeSelection={activeSelection}
            setActiveSelection={setActiveSelection}
            handleRemoveInlineComment={handleRemoveInlineComment}
            handleEditorDidMount={handleEditorDidMount}
            theme={theme}
            onApprove={handleApprove}
            onReject={handleReject}
            onAiCheck={handleAiCheck}
            aiCheckLoading={aiCheckLoading}
            highlightedCommentId={highlightedCommentId}
            setHighlightedCommentId={setHighlightedCommentId}
          />
        </div>
      </div>
  );
}