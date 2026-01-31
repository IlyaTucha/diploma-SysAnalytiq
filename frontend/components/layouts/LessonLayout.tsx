import { useState, useEffect, ReactNode } from 'react';
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

import { ChevronLeft, ChevronRight, CheckCircle, Lightbulb } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from "sonner";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer';

import { lessonsData } from '@/mocks/LessonsMock';
import { modulesData } from '@/mocks/ModulesMock';
import { useAuth } from '@/components/contexts/AuthContext';

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

  children,
  taskPanel: externalTaskPanel,
  workspacePanel: externalWorkspacePanel,
}: LessonLayoutProps) {
  const { lessonId } = useParams();
  
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
  
  const { user } = useAuth();
  const [code, setCode] = useState(initialCode);
  const [status, setStatus] = useState<'idle' | 'pending' | 'accepted' | 'rejected'>(lessonStatus);
  const [isVerified, setIsVerified] = useState(false);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    setStatus(lessonStatus);
  }, [lessonStatus]);

  const handleComplete = () => {
    if (user?.groupId) {
      setStatus('pending');
      toast.success('Задание отправлено на проверку');
    } else {
      setStatus('accepted');
      toast.success('Задание успешно завершено');
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

  let LeftPanel: ReactNode = externalTaskPanel;
  let RightPanel: ReactNode = externalWorkspacePanel;

  if (isPracticeMode && !LeftPanel) {
    LeftPanel = (
      <div className="flex flex-col h-full">
        <div className="mb-6">
          <h1 className="mb-2 text-2xl font-bold">{lessonTitle}</h1>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0 flex flex-col">
            <div className="text-sm mb-4 flex-1">
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
            
            <div className="mt-8 pt-4 border-t flex flex-col gap-4">
              {status === 'rejected' && teacherComment && (
                <Alert variant="destructive">
                  <AlertDescription>
                   {teacherComment}
                  </AlertDescription>
                </Alert>
              )}

              <Button 
                variant="outline"
                onClick={handleCheckWrapper}
                className="w-full"
                disabled={status === 'accepted' || status === 'pending'}
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
                disabled={status === 'accepted' || status === 'pending' || (status === 'idle' && !isVerified)}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                {
                  status === 'accepted' ? 'Задание принято' :
                  status === 'pending' ? 'Отправлено на проверку' :
                  status === 'rejected' ? 'Требует исправлений' :
                  'Отправить на проверку'
                }
              </Button>
            </div>
        </div>
      </div>
    );
  }

  if (isPracticeMode && !RightPanel && renderEditor) {
    RightPanel = (
      <div className="h-full w-full p-0 md:p-4 flex flex-col min-h-0">
        {renderEditor(code, setCode)}
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background flex flex-col">
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
                <BreadcrumbPage>{lessonTitle}</BreadcrumbPage>
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
              <div className="h-full p-4 md:p-6">
                {LeftPanel}
              </div>
            </ResizablePanel>
            
            <ResizableHandle />

            <ResizablePanel defaultSize={70} minSize={30}>
              <div className="h-full bg-muted/10 flex flex-col overflow-hidden">
                {RightPanel}
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        )}
      </div>
    </div>
  );
}
