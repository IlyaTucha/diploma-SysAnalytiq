import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Edit, Trash2, GripVertical } from 'lucide-react';
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
  dragHandleProps?: {
    onDragStart: (e: React.DragEvent) => void;
    onDragEnd: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
    draggable: boolean;
  };
}

export function LessonCard({ lesson, isEditing, onEdit, onDelete, dragHandleProps }: LessonCardProps) {
  return (
    <div className="flex items-stretch gap-2">
      {dragHandleProps && (
        <div
          className="cursor-grab active:cursor-grabbing flex items-center text-muted-foreground hover:text-foreground transition-colors"
          draggable={dragHandleProps.draggable}
          onDragStart={dragHandleProps.onDragStart}
          onDragEnd={dragHandleProps.onDragEnd}
        >
          <GripVertical className="w-5 h-5" />
        </div>
      )}
      <Card
        id={`lesson-${lesson.id}`}
        className={`flex-1 p-6 rounded-xl ${isEditing ? 'ring-2 ring-primary' : ''}`}
        onDragOver={dragHandleProps?.onDragOver}
        onDrop={dragHandleProps?.onDrop}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {getTypeIcon(lesson.type)}
                <h3>{lesson.title}</h3>
                <Badge variant={lesson.published ? 'default' : 'secondary'}>
                  {lesson.published ? 'Опубликован' : 'Черновик'}
                </Badge>
              </div>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Удалить урок?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы уверены, что хотите удалить урок «{lesson.title}»? Это действие нельзя отменить.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(lesson.id)}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Удалить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
    </div>
  );
}



