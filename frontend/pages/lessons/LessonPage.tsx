import { useParams, Navigate } from 'react-router-dom';
import { useData } from '@/lib/data';
import { useAuth } from '@/components/contexts/AuthContext';
import { SqlLessonView } from '@/components/lessons/views/SqlLessonView';
import { BpmnLessonView } from '@/components/lessons/views/BpmnLessonView';
import { ErdLessonView } from '@/components/lessons/views/ErdLessonView';
import { PlantUmlLessonView } from '@/components/lessons/views/PlantUmlLessonView';
import { SwaggerLessonView } from '@/components/lessons/views/SwaggerLessonView';
import { TheoryLessonView } from '@/components/lessons/views/TheoryLessonView';

export default function LessonPage() {
  const { moduleSlug, lessonId } = useParams();
  const { modules: modulesData, lessons: lessonsData } = useData();
  const { isAdmin } = useAuth();
  const id = lessonId || '';
  
  if (!moduleSlug) {
    return <Navigate to="/modules" />;
  }

  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  
  const lesson = lessonsData.find(l => l.id === id);

  if (!lesson) {
    return (
      <div className="p-8 text-center text-muted-foreground m-4">
        <h2 className="text-lg font-bold">Урок не найден</h2>
        <p className="text-sm mt-2">Возможно, урок был удалён или ещё не опубликован.</p>
      </div>
    );
  }

  // Черновики недоступны для студентов
  if (!lesson.published && !isAdmin) {
    return (
      <div className="p-8 text-center text-muted-foreground m-4">
        <h2 className="text-lg font-bold">Урок недоступен</h2>
        <p className="text-sm mt-2">Этот урок ещё не опубликован преподавателем.</p>
      </div>
    );
  }

  if (currentModule && lesson.moduleId !== currentModule.id) {
     return (
       <div className="p-8 text-center bg-destructive/10 text-destructive rounded-md border border-destructive/20 m-4">
         <h2 className="text-lg font-bold">Ошибка доступа</h2>
         <p>Урок "{lesson.title}" не принадлежит модулю "{currentModule.title}".</p>
         <p className="text-sm mt-2">Пожалуйста, используйте корректную навигацию.</p>
       </div>
     );
  }

  if (lesson.type === 'theory') {
    return <TheoryLessonView lesson={lesson} />;
  }

  // Определяем тип редактора по slug модуля
  switch (moduleSlug) {
    case 'sql': return <SqlLessonView lesson={lesson} />;
    case 'bpmn': return <BpmnLessonView lesson={lesson} />;
    case 'er':
    case 'erd': return <ErdLessonView lesson={lesson} />;
    case 'plantuml': return <PlantUmlLessonView lesson={lesson} />;
    case 'swagger': return <SwaggerLessonView lesson={lesson} />;
    default: return (
      <div className="p-8 text-center text-muted-foreground m-4">
        <h2 className="text-lg font-bold">Неизвестный тип модуля</h2>
        <p className="text-sm mt-2">Для модуля «{currentModule?.title || moduleSlug}» не найден подходящий редактор.</p>
      </div>
    );
  }
}
