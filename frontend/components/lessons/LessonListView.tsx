import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Link, useParams, Navigate } from 'react-router-dom';
import { BookOpen, Code, Lock, PlayCircle, CheckCircle, Clock, AlertCircle, Edit, ArrowLeft, ArrowRight } from 'lucide-react';
import { modulesData } from '@/mocks/ModulesMock';
import { lessonsData } from '@/mocks/LessonsMock';
import { useAuth } from '@/components/contexts/AuthContext';
import { useProgress } from '@/components/contexts/ProgressContext';

export default function LessonListView() {
  const { moduleSlug } = useParams();
  const { isAdmin: _isAdmin } = useAuth();
  const { isLessonCompleted } = useProgress();
  
  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  const currentModuleId = currentModule?.id || 1;
  const ModuleIcon = currentModule?.icon || BookOpen;

  const currentModuleIndex = modulesData.findIndex(m => m.slug === moduleSlug);
  const prevModule = currentModuleIndex > 0 ? modulesData[currentModuleIndex - 1] : null;
  const nextModule = currentModuleIndex < modulesData.length - 1 ? modulesData[currentModuleIndex + 1] : null;

  const lessons = lessonsData
    .filter(l => l.moduleId === currentModuleId)
    .map(l => ({
      ...l,
      status: isLessonCompleted(l.id) ? 'completed' : 'current',
      path: `/modules/${moduleSlug}/${l.id}`
    })); 

  if (!currentModule) {
    return <Navigate to="/" replace />;
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'theory':
        return <BookOpen className="w-4 h-4" />;
      case 'practice':
        return <Code className="w-4 h-4" />;
      default:
        return <BookOpen className="w-4 h-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'theory':
        return { backgroundColor: '#4F46E5' };
      case 'practice':
        return { backgroundColor: '#10B981' };
      default:
        return { backgroundColor: '#4F46E5' };
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8 flex flex-col h-full">
      <div className="max-w-4xl mx-auto w-full flex-1 flex flex-col">
          <Breadcrumb className="mb-6">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/modules">Модули</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentModule.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="p-3 rounded-xl"
                style={{ backgroundColor: `${currentModule.color}20`, color: currentModule.color }}
              >
                <ModuleIcon className="w-6 h-6" />
              </div>
              <h1>{currentModule.title}</h1>
            </div>
            <p className="text-muted-foreground mb-6">
              {currentModule.description}
            </p>
          </div>

          <div className="space-y-4 mb-auto">
            <h2 className="mb-4">Содержание модуля</h2>
            {lessons.length === 0 ? (
              <Card className="p-8 text-center text-muted-foreground">
                <p>В этом модуле пока нет заданий.</p>
              </Card>
            ) : (
              lessons.map((lesson, index) => (
                <Card
                  key={lesson.id}
                  className={`rounded-xl ${lesson.status === 'locked' ? 'opacity-60' : ''}`}
                >
                  <div className="flex items-start gap-6 p-6">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          lesson.status === 'completed'
                            ? 'bg-green-100'
                            : lesson.status === 'current'
                            ? 'text-white'
                            : lesson.status === 'pending_review'
                            ? 'text-white'
                            : lesson.status === 'needs_revision'
                            ? 'text-white'
                            : 'bg-muted'
                        }`}
                        style={
                          lesson.status === 'current'
                            ? { backgroundColor: '#4F46E5' }
                            : lesson.status === 'pending_review'
                            ? { backgroundColor: '#F59E0B' }
                            : lesson.status === 'needs_revision'
                            ? { backgroundColor: '#EF4444' }
                            : {}
                        }
                      >
                        {lesson.status === 'completed' ? (
                          <CheckCircle className="w-6 h-6 text-success" />
                        ) : lesson.status === 'pending_review' ? (
                          <Clock className="w-5 h-5 text-white" />
                        ) : lesson.status === 'needs_revision' ? (
                          <AlertCircle className="w-5 h-5 text-white" />
                        ) : lesson.status === 'locked' ? (
                          <Lock className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <span>{lesson.number}</span>
                        )}
                      </div>
                      {index < lessons.length - 1 && (
                        <div className="w-0.5 h-16 bg-border my-2" />
                      )}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Badge style={getTypeBadgeColor(lesson.type)} className="text-white">
                          <span className="flex items-center gap-1">
                            {getTypeIcon(lesson.type)}
                            {lesson.type === 'theory' ? 'Теория' : 'Практика'}
                          </span>
                        </Badge>
                      </div>
                      <h3 className="mb-2">{lesson.title}</h3>
                      <div className="flex items-center gap-4">
                        <Link to={lesson.path}>
                          <Button
                            variant={lesson.status === 'completed' ? 'outline' : 'default'}
                            style={
                              lesson.status === 'current'
                                ? { backgroundColor: '#4F46E5' }
                                : lesson.status === 'needs_revision'
                                ? { backgroundColor: '#EF4444' }
                                : lesson.status === 'pending_review'
                                ? { backgroundColor: '#F59E0B' }
                                : {}
                            }
                          >
                            {lesson.status === 'completed' ? (
                              <span className="flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Пройдено
                              </span>
                            ) : lesson.status === 'current' ? (
                              <span className="flex items-center gap-2">
                                <PlayCircle className="w-4 h-4" />
                                Продолжить
                              </span>
                            ) : lesson.status === 'pending_review' ? (
                              <span className="flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Ожидает проверки
                              </span>
                            ) : lesson.status === 'needs_revision' ? (
                              <span className="flex items-center gap-2">
                                <Edit className="w-4 h-4" />
                                Исправить
                              </span>
                            ) : (
                              <span className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Заблокирован
                              </span>
                            )}
                          </Button>
                        </Link>
                        {lesson.status === 'completed' && (
                          <span className="text-sm text-success">
                            ✓ Завершено
                          </span>
                        )}
                        {lesson.status === 'pending_review' && (
                          <span className="text-sm text-warning">
                            Работа на проверке
                          </span>
                        )}
                        {lesson.status === 'needs_revision' && (
                          <span className="text-sm text-destructive">
                            Требует доработки
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          <div className="flex justify-between mt-auto pt-6 border-t mt-8">
            {prevModule ? (
              <Link to={`/modules/${prevModule.slug}`}>
                <Button variant="ghost" className="h-auto py-4 px-6 hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="p-2 rounded-full bg-muted group-hover:bg-background transition-colors">
                      <ArrowLeft className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex flex-col items-start gap-1">
                      <span className="text-xs text-muted-foreground text-left">Предыдущий модуль</span>
                      <span className="text-sm font-medium text-left">{prevModule.title}</span>
                    </div>
                  </div>
                </Button>
              </Link>
            ) : (
              <div />
            )}

            {nextModule && (
              <Link to={`/modules/${nextModule.slug}`}>
                <Button variant="ghost" className="h-auto py-4 px-6 hover:bg-muted/50">
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs text-muted-foreground text-right">Следующий модуль</span>
                      <span className="text-sm font-medium text-right">{nextModule.title}</span>
                    </div>
                    <div className="p-2 rounded-full bg-primary group-hover:bg-primary/90 transition-colors">
                      <ArrowRight className="w-5 h-5 text-primary-foreground" />
                    </div>
                  </div>
                </Button>
              </Link>
            )}
          </div>
        </div>
    </div>
  );
}
