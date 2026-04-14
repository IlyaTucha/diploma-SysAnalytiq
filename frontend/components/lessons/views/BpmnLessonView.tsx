import { useState } from 'react';
import { toast } from "sonner";
import { BpmnEditorPanel } from '@/components/editors/bpmn/BpmnEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { lessonsApi } from '@/lib/api';

interface BpmnLessonViewProps {
  lesson: any;
}

export function BpmnLessonView({ lesson }: BpmnLessonViewProps) {
  const { nextLink, prevLink, nextLabel, prevLabel } = useLessonNavigation();

  const content = lesson;

  const initialCode = content.initialCode || '';

  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (code: string) => {
    setError(null);
    
    if (!lesson?.slug) {
      setError('Идентификатор урока не найден');
      return false;
    }
    
    try {
      const response = await lessonsApi.validateSolution(lesson.slug, code);
      
      if (!response || !response.valid) {
        const msg = response?.error || 'Ошибка валидации решения';
        setError(msg);
        return false;
      }

      toast.success(response.message || "Задание выполнено!");
      return true;
    } catch (e: any) {
      setError(e.message || 'Ошибка при проверке решения');
      return false;
    }
  };

  return (
    <LessonLayout
      lessonTitle={content.title}
      task={content.content || ''}
      initialCode={initialCode}
      onCheck={handleCheck}
      hint={content.hint}
      checkButtonText="Проверить диаграмму"
      backLink={prevLink}
      nextLink={nextLink}
      backLabel={prevLabel}
      nextLabel={nextLabel}
      renderEditor={(code, setCode) => (
        <div className="h-full relative flex flex-col">
          {error && (
            <div className="p-3 text-sm border-b bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300 flex-shrink-0">
                {error}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <BpmnEditorPanel
                bpmnCode={code}
                setBpmnCode={setCode}
                handleReset={() => setCode(content.initialCode || '')}
                height="100%"
                readOnly={false}
            />
          </div>
        </div>
      )}
    />
  );
}
