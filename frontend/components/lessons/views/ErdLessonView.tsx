import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from "sonner";
import { ErdEditorPanel, ErdEditorPanelRef } from '@/components/editors/erd/ErdEditorPanel';
import { ErdLayout } from '@/components/editors/erd/ErdDiagram';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { useData } from '@/lib/data';
import { lessonsApi } from '@/lib/api';

interface ErdLessonViewProps {
  lesson: any;
}

export function ErdLessonView({ lesson }: ErdLessonViewProps) {
  const { nextLink, prevLink, nextLabel, prevLabel } = useLessonNavigation();
  const { lessonId } = useParams();
  const { submissions } = useData();

  const content = lesson;

  const initialCode = content.initialCode || '';

  const [error, setError] = useState<string | null>(null);
  const erdPanelRef = useRef<ErdEditorPanelRef>(null);

  // Загрузка сохранённой раскладки из существующей отправки
  const existingSubmission = lessonId ? submissions.find(s => s.lessonId === lessonId) : undefined;
  const savedLayout: ErdLayout | null = existingSubmission?.executionResult?.nodePositions
    ? existingSubmission.executionResult as ErdLayout
    : null;

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
      checkButtonText="Проверить схему"
      backLink={prevLink}
      nextLink={nextLink}
      backLabel={prevLabel}
      nextLabel={nextLabel}
      submissionExtra={() => erdPanelRef.current ? { executionResult: erdPanelRef.current.getLayout() } : {}}
      renderEditor={(code, setCode) => (
        <div className="h-full relative flex flex-col">
          {error && (
            <div className="p-3 text-sm border-b bg-red-50 text-red-900 dark:bg-red-900/20 dark:text-red-300 flex-shrink-0">
                {error}
            </div>
          )}
          <div className="flex-1 min-h-0">
            <ErdEditorPanel
                ref={erdPanelRef}
                code={code}
                onChange={setCode}
                handleReset={() => setCode(content.initialCode || '')}
                height="100%"
                initialLayout={savedLayout}
            />
          </div>
        </div>
      )}
    />
  );
}
