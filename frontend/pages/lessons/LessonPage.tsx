import { useParams, Navigate } from 'react-router-dom';
import { lessonsData } from '@/mocks/LessonsMock';
import { modulesData } from '@/mocks/ModulesMock';
import { SqlLessonView } from '@/components/lessons/views/SqlLessonView';
import { BpmnLessonView } from '@/components/lessons/views/BpmnLessonView';
import { ErdLessonView } from '@/components/lessons/views/ErdLessonView';
import { PlantUmlLessonView } from '@/components/lessons/views/PlantUmlLessonView';
import { SwaggerLessonView } from '@/components/lessons/views/SwaggerLessonView';
import { TheoryLessonView } from '@/components/lessons/views/TheoryLessonView';

export default function LessonPage() {
  const { moduleSlug, lessonId } = useParams();
  const id = lessonId || '';
  
  if (!moduleSlug) {
    return <Navigate to="/modules" />;
  }

  const currentModule = modulesData.find(m => m.slug === moduleSlug);
  
  // 1. Find the lesson by ID
  const lesson = lessonsData.find(l => l.id === id);

  if (!lesson) {
    return <div>Урок не найден</div>;
  }

  // 2. Security Check: Ensure the lesson actually belongs to the requested module
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

  switch (lesson.slug) {
    case 'sql': return <SqlLessonView lesson={lesson} />;
    case 'bpmn': return <BpmnLessonView lesson={lesson} />;
    case 'er': return <ErdLessonView lesson={lesson} />;
    case 'plantuml': return <PlantUmlLessonView lesson={lesson} />;
    case 'swagger': return <SwaggerLessonView lesson={lesson} />;
    default: return <div>Неизвестный тип практического урока: {lesson.slug}</div>;
  }
}
