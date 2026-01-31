import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2 } from 'lucide-react';
import { getTypeIcon } from '@/const';

interface LessonCardProps {
  lesson: {
    id: string;
    title: string;
    type: string;
    content: string;
    published: boolean;
  };
  isEditing: boolean;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function LessonCard({ lesson, isEditing, onEdit, onDelete }: LessonCardProps) {
  return (
    <Card
      id={`lesson-${lesson.id}`}
      className={`p-6 rounded-xl ${isEditing ? 'ring-2 ring-primary' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            {getTypeIcon(lesson.type)}
            <h3>{lesson.title}</h3>
            <Badge variant={lesson.published ? 'default' : 'secondary'}>
              {lesson.published ? 'Опубликован' : 'Черновик'}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2 ml-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onEdit(lesson.id)}
          >
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDelete(lesson.id)}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}



