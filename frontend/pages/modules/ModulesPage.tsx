import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { useProgress } from '@/components/contexts/ProgressContext';
import { useData } from '@/lib/data';
import { getNoun } from '@/components/ui/utils';
import { moduleSlugOrder } from '@/const';

export default function ModulesPage() {
  const { isAdmin, user } = useAuth();
  const { getThemeColor } = useTheme();
  const { completedLessons } = useProgress();
  const { modules: modulesData, lessons: lessonsData, submissions } = useData();

  // Сортируем модули в определённом порядке
  const sortedModules = [...modulesData].sort((a, b) => {
    const idxA = moduleSlugOrder.indexOf(a.slug);
    const idxB = moduleSlugOrder.indexOf(b.slug);
    return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
  });

  // Для студентов скрываем неопубликованные модули
  const visibleModules = isAdmin ? sortedModules : sortedModules.filter(m => m.published);

  const modules = visibleModules.map((module) => {
    const moduleLessons = lessonsData.filter(l => l.moduleId === module.id && l.published);
    const totalLessons = moduleLessons.length;
    const completedCount = moduleLessons.filter(l => {
      if (!completedLessons.includes(l.id)) return false;
      // Не считаем прогресс, если работа ожидает проверки
      if (user?.groupId && !isAdmin) {
        const sub = submissions.find(s => s.lessonId === l.id);
        if (sub?.status === 'pending') return false;
      }
      return true;
    }).length;
    const progress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

    return {
      ...module,
      icon: <module.icon className="w-8 h-8" />,
      locked: false,
      lessons: {
        total: totalLessons,
        completed: completedCount
      },
      progress: progress
    };
  });



  return (
    <div className="flex flex-col h-full">
        <div className="bg-card border-b border-border p-6">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
              <h1>Модули</h1>
            </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {modules.map((module) => (
              <Card
                key={module.id}
                className={`p-6 rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 flex flex-col ${
                  module.locked ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div
                    className="p-3 rounded-xl flex-shrink-0"
                    style={{ backgroundColor: module.color + '20', color: module.color }}
                  >
                    {module.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold leading-none">{module.title}</h3>
                  </div>
                </div>
                
                <p className="text-muted-foreground mb-4">{module.description}</p>
                
                <div className="mt-auto">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Прогресс</span>
                      <span className="flex gap-1">
                        <span>{module.lessons.completed}</span>
                        <span>из</span>
                        <span>{module.lessons.total}</span>
                        <span>{getNoun(module.lessons.total, 'урока', 'уроков', 'уроков')}</span>
                      </span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>
                  
                  <Link to={module.locked ? '#' : `/modules/${module.slug}`}>
                    <Button
                      disabled={module.locked}
                      className="w-full"
                      style={module.locked ? {} : { backgroundColor: module.color }}
                    >
                      {module.locked ? 'Заблокирован' : 'Открыть'}
                    </Button>
                  </Link>
                </div>
              </Card>
            ))}
          </div>
      </div>
    </div>
  );
}
