import { Button } from '@/components/ui/button';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { toast } from "sonner";
import { useData } from '@/lib/data';
import { lessonsApi } from '@/lib/api';
import { LessonForm } from '@/components/admin/lessons/LessonForm';
import { ModuleHeader } from '@/components/admin/modules/ModuleHeader';
import { LessonList } from '@/components/admin/lessons/LessonList';

import { validateLessonForm } from '@/components/admin/lessons/LessonValidation';

function mapLesson(l: any) {
  return {
    id: l.id,
    slug: l.slug,
    number: l.number,
    title: l.title,
    type: l.type,
    content: l.content || '',
    correctAnswer: l.correctAnswer || '',
    hint: l.hint || '',
    published: l.published,
  };
}

export default function AdminModuleContent() {
  const { moduleSlug } = useParams();
  const { modules: modulesData, lessons: lessonsData, reloadLessons } = useData();
  const [isCreatingLesson, setIsCreatingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  const currentModuleId = currentModule?.id || 1;
  const moduleType = currentModule?.title.toLowerCase() || 'theory';

  const [lessons, setLessons] = useState<any[]>(() => {
    const moduleLessons = lessonsData.filter(l => l.moduleId === currentModuleId);
    return moduleLessons.map(mapLesson);
  });

  // Синхронизируем локальное состояние при обновлении данных из контекста
  const latestLessons = useMemo(() => {
    return lessonsData.filter(l => l.moduleId === currentModuleId).map(mapLesson);
  }, [lessonsData, currentModuleId]);

  useEffect(() => {
    setLessons(latestLessons);
  }, [latestLessons]);

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

  const handleCreateLesson = async () => {
    if (!validateForm()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    try {
      const maxNumber = lessons.reduce((max, l: any) => Math.max(max, l.number || 0), 0);
      await lessonsApi.create({
        moduleId: currentModuleId,
        number: maxNumber + 1,
        title: lessonFormData.title,
        type: lessonFormData.type,
        content: lessonFormData.content,
        correctAnswer: lessonFormData.correctAnswer || undefined,
        hint: lessonFormData.hint || undefined,
        published: lessonFormData.published,
      });
      await reloadLessons();
      setLessonFormData({ title: '', type: 'theory', content: '', correctAnswer: '', hint: '', published: false });
      setErrors({});
      setIsCreatingLesson(false);
      toast.success('Урок успешно создан!');
    } catch {
      toast.error('Ошибка при создании урока');
    }
  };

  const handleUpdateLesson = async () => {
    if (!validateForm()) {
      toast.error('Заполните все обязательные поля');
      return;
    }

    const lesson = lessons.find(l => l.id === editingLessonId);
    if (!lesson) return;

    try {
      const identifier = lesson.slug || lesson.id;
      await lessonsApi.update(identifier, {
        title: lessonFormData.title,
        type: lessonFormData.type,
        content: lessonFormData.content,
        correctAnswer: lessonFormData.correctAnswer || undefined,
        hint: lessonFormData.hint || undefined,
        published: lessonFormData.published,
      });
      setLessonFormData({ title: '', type: 'theory', content: '', correctAnswer: '', hint: '', published: false });
      setErrors({});
      setEditingLessonId(null);
      toast.success('Урок обновлен!');
      await reloadLessons();
    } catch {
      toast.error('Ошибка при обновлении урока');
    }
  };

  const handleDeleteLesson = async (id: string) => {
    const lesson = lessons.find(l => l.id === id);
    if (!lesson) return;
    try {
      const identifier = lesson.slug || lesson.id;
      await lessonsApi.delete(identifier);
      setLessons(lessons.filter(l => l.id !== id));
      toast.success('Урок удален');
      reloadLessons();
    } catch {
      toast.error('Ошибка при удалении урока');
    }
  };

  const handleReorderLessons = async (reorderedLessons: any[]) => {
    setLessons(reorderedLessons);
    try {
      const lessonIds = reorderedLessons.map(l => l.id);
      await lessonsApi.reorder(moduleSlug!, lessonIds);
      await reloadLessons();
      toast.success('Порядок уроков обновлён');
    } catch {
      toast.error('Ошибка при изменении порядка');
      setLessons(latestLessons);
    }
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
            onReorder={handleReorderLessons}
          />
    </div>
  );
}
