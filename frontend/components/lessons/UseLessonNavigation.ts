import { useParams } from 'react-router-dom';
import { useData } from '@/lib/data';
import { useAuth } from '@/components/contexts/AuthContext';

export function useLessonNavigation() {
  const { moduleSlug, lessonId } = useParams();
  const { modules: modulesData, lessons: lessonsData } = useData();
  const { isAdmin } = useAuth();
  const currentLessonId = lessonId || '';

  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  const currentModuleId = currentModule?.id || 1;

  // Для студентов показываем только опубликованные уроки
  const moduleLessons = lessonsData
    .filter(l => l.moduleId === currentModuleId && (l.published || isAdmin))
    .sort((a, b) => a.number - b.number);

  const currentLessonIndex = moduleLessons.findIndex(l => l.id === currentLessonId);
  const prevLesson = moduleLessons[currentLessonIndex - 1];
  const nextLesson = moduleLessons[currentLessonIndex + 1];

  const prevLink = prevLesson ? `/modules/${moduleSlug}/${prevLesson.id}` : `/modules/${moduleSlug}`;
  const nextLink = nextLesson ? `/modules/${moduleSlug}/${nextLesson.id}` : `/modules/${moduleSlug}`;

  const prevTitle = prevLesson
    ? `Назад: ${prevLesson.title}${!prevLesson.published ? ' (Черновик)' : ''}`
    : 'К списку модулей';
  const nextTitle = nextLesson
    ? `Далее: ${nextLesson.title}${!nextLesson.published ? ' (Черновик)' : ''}`
    : 'Модуль завершен';
  
  return {
    currentModuleId,
    prevLink,
    nextLink,
    prevLabel: prevTitle,
    nextLabel: nextTitle,
  };
}
