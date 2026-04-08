import { useState, useEffect, useMemo, useRef, ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';

import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle, Lightbulb, History, XCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from "sonner";
import { getNoun } from '@/components/ui/utils';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

import { useData } from '@/lib/data';
import { useAuth } from '@/components/contexts/AuthContext';
import { useProgress } from '@/components/contexts/ProgressContext';
import { useNotifications } from '@/components/contexts/NotificationContext';
import { submissionsApi, progressApi } from '@/lib/api';
import { ReviewHistoryDialog } from '@/components/admin/reviews/ReviewHistoryDialog';

interface LessonLayoutProps {
  moduleId?: string;
  defaultModuleId?: string;
  lessonTitle: string;
  backLink?: string;
  nextLink?: string;
  backLabel?: string;
  nextLabel?: string;
  isNextDisabled?: boolean;
  nextTooltip?: string;

  task?: string;
  initialCode?: string;
  onCheck?: (code: string) => boolean | Promise<boolean>;
  renderEditor?: (code: string, setCode: (code: string) => void) => ReactNode;
  checkButtonText?: string;
  hint?: string;
  
  submissionExtra?: Record<string, any> | (() => Record<string, any>);
  
  lessonStatus?: 'idle' | 'pending' | 'accepted' | 'rejected';
  teacherComment?: string;

  children?: ReactNode;
  
  taskPanel?: ReactNode;
  workspacePanel?: ReactNode;
}

export function LessonLayout({
  moduleId: propModuleId,
  defaultModuleId = '1',
  lessonTitle,
  backLink,
  nextLink,
  backLabel = "Назад к урокам",
  nextLabel = "Следующее задание",
  isNextDisabled = false,
  nextTooltip,

  task,
  initialCode = '',
  onCheck,
  
  lessonStatus = 'idle',
  teacherComment,
  renderEditor,
  checkButtonText = "Проверить решение",
  hint,
  submissionExtra,

  children,
  taskPanel: externalTaskPanel,
  workspacePanel: externalWorkspacePanel,
}: LessonLayoutProps) {
  const { lessonId } = useParams();
  const { modules: modulesData, lessons: lessonsData, submissions, reloadSubmissions } = useData();
  
  let derivedModuleId = defaultModuleId;
  if (lessonId) {
    const lesson = lessonsData.find(l => l.id === lessonId);
    if (lesson) {
      derivedModuleId = lesson.moduleId.toString();
    }
  }
  const moduleId = propModuleId || derivedModuleId;

  const currentModule = modulesData.find(m => 
    m.id.toString() === moduleId || 
    m.slug === moduleId ||
    m.title.toLowerCase() === moduleId.toLowerCase()
  );
  
  const resolvedModule = currentModule;
  const moduleName = resolvedModule?.title || 'Модуль';
  const linkId = resolvedModule?.slug || moduleId;
  const moduleLink = `/modules/${linkId}`;
  const defaultBackLink = `/modules/${linkId}`;
  const defaultNextLink = `/modules/${linkId}`;
  
  const { user, isAdmin } = useAuth();
  const { completedLessons, markLessonCompleted } = useProgress();
  const { refreshNotifications } = useNotifications();

  // Загружаем сохранённое решение из submissions
  const existingSubmission = lessonId ? submissions.find(s => s.lessonId === lessonId) : undefined;
  const savedSolution = existingSubmission?.studentSolution;
  const currentLesson = lessonId ? lessonsData.find(l => l.id === lessonId) : undefined;
  const isCompleted = lessonId ? completedLessons.includes(lessonId) : false;

  // Определяем статус из существующих данных
  const derivedStatus = useMemo((): 'idle' | 'pending' | 'accepted' | 'rejected' => {
    if (existingSubmission?.status === 'approved') return 'accepted';
    if (existingSubmission?.status === 'rejected') return 'rejected';
    if (existingSubmission?.status === 'pending') {
      // Если есть группа — показываем pending, иначе — accepted
      if (!user?.groupId || isAdmin) return 'accepted';
      return 'pending';
    }
    if (isCompleted) return 'accepted';
    return lessonStatus;
  }, [existingSubmission?.status, user?.groupId, isAdmin, isCompleted, lessonStatus]);

  const [code, setCode] = useState(savedSolution || initialCode);
  const [status, setStatus] = useState<'idle' | 'pending' | 'accepted' | 'rejected'>(derivedStatus);
  const [isVerified, setIsVerified] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showReviewHistory, setShowReviewHistory] = useState(false);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<any>(null);

  // Трекер первичной загрузки сохранённого решения
  const savedSolutionLoadedRef = useRef(!!savedSolution);

  // Сбрасываем состояние при переключении задания
  useEffect(() => {
    setCode(savedSolution || initialCode);
    savedSolutionLoadedRef.current = !!savedSolution;
    setIsVerified(false);
    setShowHint(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessonId]);

  // Подхватываем сохранённое решение при асинхронной загрузке submissions
  useEffect(() => {
    if (savedSolution && !savedSolutionLoadedRef.current) {
      savedSolutionLoadedRef.current = true;
      setCode(savedSolution);
    }
  }, [savedSolution]);

  // Синхронизируем status с computed derivedStatus
  useEffect(() => {
    setStatus(derivedStatus);
  }, [derivedStatus]);

  // Определяем, нужна ли проверка преподавателем
  const needsReview = !isAdmin && !!user?.groupId;

  const handleComplete = async () => {
    if (!lessonId) return;
    const extra = typeof submissionExtra === 'function' ? submissionExtra() : submissionExtra;
    try {
      if (isAdmin || !user?.groupId) {
        // Админ или без группы: сохраняем решение, автоматически принимаем
        await submissionsApi.create({ lessonId, studentSolution: code, ...extra });
        await progressApi.complete(lessonId);
        markLessonCompleted(lessonId, true);
        await reloadSubmissions();
        setStatus('accepted');
        toast.success('Задание завершено');
      } else {
        // Студент с группой: отправляем на проверку
        await submissionsApi.create({ lessonId, studentSolution: code, ...extra });
        await reloadSubmissions();
        refreshNotifications();
        setStatus('pending');
        setIsVerified(false);
        toast.success('Задание отправлено на проверку');
      }
    } catch (err) {
      console.error('Submission error:', err);
      toast.error('Ошибка при отправке решения');
    }
  };

  const handleCheckWrapper = async () => {
    if (onCheck) {
      const result = await onCheck(code);
      if (result) {
        setIsVerified(true);
      }
    } else {
      if (!code) {
        toast.error("Решение пустое");
        return;
      }
      toast.success("Проверка пройдена успешно!");
      setIsVerified(true);
    }
  };

  const isPracticeMode = !!renderEditor;

  const reviewHistory = (existingSubmission as any)?.reviewHistory || [];

  const studentName = user?.name || '';

  let LeftPanel: ReactNode = externalTaskPanel;
  let RightPanel: ReactNode = externalWorkspacePanel;

  if (isPracticeMode && !LeftPanel) {
    LeftPanel = (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">{lessonTitle}</h1>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0" style={{ scrollbarGutter: 'stable' }}>
            <div className="text-sm mb-4">
              <MarkdownRenderer content={task || ''} />
            </div>
            
            {hint && (
              <div className="pt-4">
                <Button 
                  variant="ghost" 
                  onClick={() => setShowHint(!showHint)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Lightbulb className="w-4 h-4 mr-2" />
                  {showHint ? 'Скрыть подсказку' : 'Показать подсказку'}
                </Button>
                
                {showHint && (
                  <Alert className="mt-4 bg-muted/50">
                    <AlertDescription>
                      {hint}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
            
            {reviewHistory.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <button
                  onClick={() => setShowReviewHistory(!showReviewHistory)}
                  className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer mb-2"
                >
                  {showReviewHistory ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  <History className="w-4 h-4" />
                  <span>
                    {reviewHistory.length} {getNoun(reviewHistory.length, 'проверка', 'проверки', 'проверок')}
                  </span>
                </button>
                {showReviewHistory && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    {[...reviewHistory].reverse().map((entry: any, idx: number) => {
                      const attemptNum = reviewHistory.length - idx;
                      return (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm p-2 rounded-md bg-muted/50 border cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
                          onClick={() => setSelectedHistoryEntry(entry)}
                        >
                          {entry.status === 'approved' ? (
                            <CheckCircle className="w-3.5 h-3.5 text-success flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                          )}
                          <span className="font-medium">
                            {attemptNum} попытка{idx === 0 ? ' (последняя)' : ''}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            
        </div>

        <div className="pt-4 border-t flex flex-col gap-4 flex-shrink-0">
          {status === 'rejected' && (existingSubmission?.comments || teacherComment) && (
            <Alert variant="destructive">
              <AlertDescription>
               {existingSubmission?.comments || teacherComment}
              </AlertDescription>
            </Alert>
          )}

          <Button 
            variant="outline"
            onClick={handleCheckWrapper}
            className="w-full"
            disabled={status === 'accepted'}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {checkButtonText}
          </Button>

          <Button 
            onClick={handleComplete}
            className={`w-full ${
              status === 'accepted' ? "bg-green-600 hover:bg-green-700 text-white" :
              status === 'pending' ? "bg-yellow-500 hover:bg-yellow-600 text-white" :
              status === 'rejected' ? "bg-red-600 hover:bg-red-700 text-white" : ""
            }`}
            disabled={status === 'accepted' || !isVerified}
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            {
              status === 'accepted' ? 'Задание принято' :
              status === 'pending' && isVerified ? 'Отправить решение' :
              status === 'pending' ? 'Ожидает проверки' :
              status === 'rejected' ? 'Отправить исправление' :
              needsReview ? 'Отправить на проверку' : 'Завершить задание'
            }
          </Button>
        </div>
      </div>
    );
  }

  if (isPracticeMode && !RightPanel && renderEditor) {
    RightPanel = (
      <div className="h-full w-full p-0 md:p-4 flex flex-col min-h-0 overflow-hidden">
        {renderEditor(code, setCode)}
      </div>
    );
  }


  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="border-b border-border bg-card px-4 py-3 flex-shrink-0">
        <div className="max-w-full mx-auto flex justify-between items-center px-4">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/modules">Модули</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={moduleLink}>{moduleName}</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {lessonTitle}
                  {currentLesson && !currentLesson.published && ' (Черновик)'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="flex items-center gap-2">
            <Link to={backLink || defaultBackLink}>
              <Button variant="outline" size="sm" className="gap-2">
                <ChevronLeft className="w-4 h-4" />
                {backLabel}
              </Button>
            </Link>

            {isNextDisabled ? (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span tabIndex={0}>
                      <Button
                        size="sm"
                        disabled
                        className="gap-2"
                      >
                        {nextLabel}
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{nextTooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Link to={nextLink || defaultNextLink}>
                <Button
                  size="sm"
                  style={{ backgroundColor: '#4F46E5' }}
                  className="gap-2 text-white"
                >
                  {nextLabel}
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0">
        {children ? (
          <div className="h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto">
              {children}
            </div>
          </div>
        ) : (
          <ResizablePanelGroup direction="horizontal" className="flex-1 h-full min-h-0">
            <ResizablePanel defaultSize={35} minSize={20} maxSize={50} className="bg-background border-r">
              <div className="h-full p-4 md:p-6 overflow-hidden flex flex-col">
                {LeftPanel}
              </div>
            </ResizablePanel>
            
            <ResizableHandle />

            <ResizablePanel defaultSize={65} minSize={30}>
              <div className="h-full bg-muted/10 flex flex-col overflow-hidden">
                {RightPanel}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>

      <ReviewHistoryDialog
        entry={selectedHistoryEntry}
        studentName={studentName}
        lessonTitle={lessonTitle}
        moduleId={resolvedModule?.id}
        onClose={() => setSelectedHistoryEntry(null)}
      />
    </div>
  );
}
