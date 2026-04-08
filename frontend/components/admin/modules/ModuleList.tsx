import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Edit, ChevronRight, BookOpen, ClipboardList } from 'lucide-react';
import { getNoun } from '@/components/ui/utils';
import { useData } from '@/lib/data';

interface ModuleListProps {
  modules: any[];
  editingId: number | null;
  handleEdit: (id: number) => void;
}

export const ModuleList = ({ modules, editingId, handleEdit }: ModuleListProps) => {
  const { lessons: lessonsData } = useData();
  return (
    <div className="space-y-4">
      {modules.map((module) => {
        const Icon = module.icon || BookOpen;
        return (
          <Card
            key={module.id}
            className={`p-6 rounded-xl ${editingId === module.id ? 'ring-2 ring-primary' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5" style={{ color: module.color }} />
                  <h3>{module.title}</h3>
                  <Badge variant={module.published ? 'default' : 'secondary'}>
                    {module.published ? 'Опубликован' : 'Черновик'}
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">{module.description}</p>
                <div className="flex items-center gap-4 mb-4">
                  {(() => {
                    const moduleLessons = lessonsData.filter(l => l.moduleId === module.id);
                    const theoryCount = moduleLessons.filter(l => l.type === 'theory').length;
                    const practiceCount = moduleLessons.filter(l => l.type === 'practice').length;
                    
                    return (
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3 h-3" />
                          {theoryCount} {getNoun(theoryCount, 'теория', 'теории', 'теорий')}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClipboardList className="w-3 h-3" />
                          {practiceCount} {getNoun(practiceCount, 'задание', 'задания', 'заданий')}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <Link to={`/admin/modules/${module.slug}`}>
                  <Button
                    variant="outline"
                    className="border-2 bg-transparent hover:bg-accent/50 dark:hover:bg-white/10"
                    style={{ borderColor: module.color, color: module.color }}
                  >
                    Управлять содержимым
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => handleEdit(module.id)}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
};
