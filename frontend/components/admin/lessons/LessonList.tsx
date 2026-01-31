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
  handleDeleteLesson
}: LessonListProps) {
  if (lessons.length === 0) {
    return (
      <Card className="p-8 text-center text-muted-foreground">
        <p>В этом модуле пока нет уроков.</p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {lessons.map((lesson) => (
        <div key={lesson.id}>
          <LessonCard
            lesson={lesson}
            isEditing={editingLessonId === lesson.id}
            onEdit={handleEditLesson}
            onDelete={handleDeleteLesson}
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
