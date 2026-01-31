import { useParams } from 'react-router-dom';
import { lessonsData } from '@/mocks/LessonsMock';
import { modulesData } from '@/mocks/ModulesMock';

export function useLessonNavigation() {
  const { moduleSlug, lessonId } = useParams();
  const currentLessonId = lessonId || '';

  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  const currentModuleId = currentModule?.id || 1;

  // Filter lessons only for the current module
  const moduleLessons = lessonsData
    .filter(l => l.moduleId === currentModuleId)
    .sort((a, b) => a.number - b.number);

  const currentLessonIndex = moduleLessons.findIndex(l => l.id === currentLessonId);
  const prevLesson = moduleLessons[currentLessonIndex - 1];
  const nextLesson = moduleLessons[currentLessonIndex + 1];

  const prevLink = prevLesson ? `/modules/${moduleSlug}/${prevLesson.id}` : `/modules/${moduleSlug}`;
  const nextLink = nextLesson ? `/modules/${moduleSlug}/${nextLesson.id}` : `/modules/${moduleSlug}`;
  
  return {
    currentModuleId,
    prevLink,
    nextLink,
    prevLabel: prevLesson ? `Назад: ${prevLesson.title}` : 'К списку модулей',
    nextLabel: nextLesson ? `Далее: ${nextLesson.title}` : 'Модуль завершен',
  };
}
