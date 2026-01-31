import { useState } from 'react';
import { toast } from "sonner";
import { PlantUmlEditorPanel } from '@/components/editors/plantuml/PlantUmlEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';

interface PlantUmlLessonViewProps {
  lesson: any;
}

export function PlantUmlLessonView({ lesson }: PlantUmlLessonViewProps) {
  const { nextLink, prevLink, nextLabel, prevLabel } = useLessonNavigation();

  const content = lesson;

  const initialCode = content.initialCode || '';

  const [error, setError] = useState<string | null>(null);

  const handleCheck = (code: string) => {
    setError(null);
    try {
      let config: any = { mode: 'code', code: '' };
      try {
        if (lesson?.correctAnswer && lesson.correctAnswer.trim().startsWith('{')) {
          config = JSON.parse(lesson.correctAnswer);
        }
      } catch {
        console.error("Ошибка парсинга конфигурации урока");
      }

      if (config.mode === 'manual') {
        const checks = config.checks || [];
        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'participant_count') {
            const participants = (code.match(/participant|actor|database|queue/g) || []).length;
            if (!checkValue(participants, expected, operator)) {
              throw new Error(`Ожидалось участников: ${expected}${suffix}, найдено: ${participants}`);
            }
          } else if (check.type === 'message_count') {
            const messages = (code.match(/->|-->/g) || []).length;
            if (!checkValue(messages, expected, operator)) {
              throw new Error(`Ожидалось сообщений: ${expected}${suffix}, найдено: ${messages}`);
            }
          } else if (check.type === 'contains_text') {
             if (!code.includes(check.value)) {
               throw new Error(`Код должен содержать: "${check.value}"`);
             }
          }
        }
      } else {
         // Code comparison mode
      }

      toast.success("Задание выполнено!");
      return true;
    } catch (e: any) {
      setError(e.message);
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
            <PlantUmlEditorPanel
                code={code}
                onChange={setCode}
                handleReset={() => setCode(content.initialCode || '')}
                height="100%"
            />
          </div>
        </div>
      )}
    />
  );
}
