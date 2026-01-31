import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from "sonner";
import { modulesData } from '@/mocks/ModulesMock';
import { lessonsData } from '@/mocks/LessonsMock';
import { LessonForm } from '@/components/admin/lessons/LessonForm';
import { ModuleHeader } from '@/components/admin/modules/ModuleHeader';
import { LessonList } from '@/components/admin/lessons/LessonList';

import { validateLessonForm } from '@/components/admin/lessons/LessonValidation';

export default function AdminModuleContent() {
  const { moduleSlug } = useParams();
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  const currentModuleId = currentModule?.id || 1;
  const moduleType = currentModule?.title.toLowerCase() || 'theory';

  const [lessons, setLessons] = useState<any[]>(() => {
    const moduleLessons = lessonsData.filter(l => l.moduleId === currentModuleId);
    return moduleLessons.map(l => ({
      id: l.id,
      title: l.title,
      type: l.type,
      content: l.content || '',
      correctAnswer: '',
      hint: l.hint || '',
      published: l.published,
    }));
  });

  const [lessonFormData, setLessonFormData] = useState({
    title: '',
    type: 'theory',
    content: '',
    correctAnswer: '',
    hint: '',
    published: false,
  });

  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validateForm = () => {
    const newErrors = validateLessonForm(lessonFormData, moduleType);
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateLesson = () => {
    if (!validateForm()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const newLesson = {
      id: crypto.randomUUID(),
      ...lessonFormData,
    };

    setLessons([...lessons, newLesson]);
    setLessonFormData({
      title: '',
      type: 'theory',
      content: '',
      correctAnswer: '',
      hint: '',
      published: false,
    });
    setErrors({});
    setIsCreatingLesson(false);
    toast.success('Урок успешно создан!');
  };

  const handleUpdateLesson = () => {
    if (!validateForm()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    setLessons(lessons.map(l =>
      l.id === editingLessonId ? { ...l, ...lessonFormData } : l
    ));
    setLessonFormData({
      title: '',
      type: 'theory',
      content: '',
        correctAnswer: '',
        hint: '',
      published: false,
    });
    setErrors({});
    setEditingLessonId(null);
    toast.success('Урок обновлен!');
  };

  const handleDeleteLesson = (id: string) => {
    setLessons(lessons.filter(l => l.id !== id));
    toast.success('Урок удален');
  };

  const handleEditLesson = (id: string) => {
    const lesson = lessons.find(l => l.id === id);
    if (lesson) {
      setLessonFormData({
        title: lesson.title,
        type: lesson.type,
        content: lesson.content,
        correctAnswer: lesson.correctAnswer || '',
        hint: lesson.hint || '',
        published: lesson.published,
      });
      setEditingLessonId(id);
      setIsCreatingLesson(false);
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 100);
      setTimeout(() => {
        const element = document.getElementById(`lesson-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    }
  };

  return (
    <div className="flex-1 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <ModuleHeader 
          title={currentModule?.title} 
          description={currentModule?.description} 
          lessonCount={lessons.length} 
        />

          <div className="mb-6 flex justify-between items-center">
            <h2>Содержание модуля</h2>
            {!isCreatingLesson && !editingLessonId && (
              <Button
                onClick={() => setIsCreatingLesson(true)}
                style={{ backgroundColor: '#10B981' }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Создать урок
              </Button>
            )}
          </div>

          {isCreatingLesson && (
            <div className="mb-6">
              <LessonForm
                title="Создание урока"
                formData={lessonFormData}
                setFormData={setLessonFormData}
                onSubmit={handleCreateLesson}
                moduleType={moduleType}
                errors={errors}
                onCancel={() => {
                  setIsCreatingLesson(false);
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

          <LessonList 
            lessons={lessons}
            editingLessonId={editingLessonId}
            lessonFormData={lessonFormData}
            setLessonFormData={setLessonFormData}
            handleUpdateLesson={handleUpdateLesson}
            moduleType={moduleType}
            errors={errors}
            setEditingLessonId={setEditingLessonId}
            setErrors={setErrors}
            handleEditLesson={handleEditLesson}
            handleDeleteLesson={handleDeleteLesson}
          />
      </div>
    </div>
  );
}
