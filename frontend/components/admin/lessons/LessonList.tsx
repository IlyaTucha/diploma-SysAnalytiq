import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { LessonCard } from './LessonCard';
import { LessonForm } from './LessonForm';

interface LessonListProps {
  lessons: any[];
  editingLessonId: string | null;
  lessonFormData: any;
  setLessonFormData: (data: any) => void;
  handleUpdateLesson: () => void;
  moduleType: string;
  errors: any;
  setEditingLessonId: (id: string | null) => void;
  setErrors: (errors: any) => void;
  handleEditLesson: (id: string) => void;
  handleDeleteLesson: (id: string) => void;
  onReorder?: (reorderedLessons: any[]) => void;
}

export function LessonList({
  lessons,
  editingLessonId,
  lessonFormData,
  setLessonFormData,
  handleUpdateLesson,
  moduleType,
  errors,
  setEditingLessonId,
  setErrors,
  handleEditLesson,
  handleDeleteLesson,
  onReorder
}: LessonListProps) {
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragItemRef = useRef<string | null>(null);

  if (lessons.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>В этом модуле пока нет уроков.</p>
      </Card>
    );
  }

  const handleDragStart = (lessonId: string) => (e: React.DragEvent) => {
    dragItemRef.current = lessonId;
    e.dataTransfer.effectAllowed = 'move';
    (e.currentTarget as HTMLElement).style.opacity = '0.5';
  };

  const handleDragEnd = () => (e: React.DragEvent) => {
    (e.currentTarget as HTMLElement).style.opacity = '1';
    dragItemRef.current = null;
    setDragOverId(null);
  };

  const handleDragOver = (lessonId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragItemRef.current && dragItemRef.current !== lessonId) {
      setDragOverId(lessonId);
    }
  };

  const handleDrop = (targetId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverId(null);
    const sourceId = dragItemRef.current;
    if (!sourceId || sourceId === targetId || !onReorder) return;

    const reordered = [...lessons];
    const sourceIdx = reordered.findIndex(l => l.id === sourceId);
    const targetIdx = reordered.findIndex(l => l.id === targetId);
    if (sourceIdx === -1 || targetIdx === -1) return;

    const [moved] = reordered.splice(sourceIdx, 1);
    reordered.splice(targetIdx, 0, moved);
    onReorder(reordered);
  };

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <div
          key={lesson.id}
          className={`transition-all ${dragOverId === lesson.id ? 'ring-2 ring-primary/50 rounded-xl' : ''}`}
        >
          <LessonCard
            lesson={lesson}
            isEditing={editingLessonId === lesson.id}
            onEdit={handleEditLesson}
            onDelete={handleDeleteLesson}
            dragHandleProps={onReorder ? {
              onDragStart: handleDragStart(lesson.id),
              onDragEnd: handleDragEnd(),
              onDragOver: handleDragOver(lesson.id),
              onDrop: handleDrop(lesson.id),
              draggable: true,
            } : undefined}
          />
          
          {editingLessonId === lesson.id && (
            <div className="mt-4">
              <LessonForm
                title="Редактирование урока"
                formData={lessonFormData}
                setFormData={setLessonFormData}
                onSubmit={handleUpdateLesson}
                moduleType={moduleType}
                errors={errors}
                onCancel={() => {
                  setEditingLessonId(null);
                  setErrors({});
                  setLessonFormData({
                    title: '',
                    type: 'theory',
                    content: '',
                    correctAnswer: '',
                    hint: '',
                    published: false,
                  });
                }}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
