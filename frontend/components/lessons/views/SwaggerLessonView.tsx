import { useState } from 'react';
import { toast } from "sonner";
import { SwaggerEditorPanel } from '@/components/editors/swagger/SwaggerEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';
import yaml from 'js-yaml';

interface SwaggerLessonViewProps {
  lesson: any;
}

export function SwaggerLessonView({ lesson }: SwaggerLessonViewProps) {
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

      let parsedSpec: any;
      try {
        parsedSpec = yaml.load(code);
      } catch {
        throw new Error("Ошибка YAML синтаксиса");
      }

      if (config.mode === 'manual') {
        const checks = config.checks || [];
        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'path_count') {
            const paths = Object.keys(parsedSpec.paths || {}).length;
            if (!checkValue(paths, expected, operator)) {
              throw new Error(`Ожидалось путей: ${expected}${suffix}, найдено: ${paths}`);
            }
          } else if (check.type === 'schema_count') {
            const schemas = Object.keys(parsedSpec.components?.schemas || {}).length;
            if (!checkValue(schemas, expected, operator)) {
              throw new Error(`Ожидалось схем: ${expected}${suffix}, найдено: ${schemas}`);
            }
          } else if (check.type === 'path_exists') {
             if (!parsedSpec.paths?.[check.value]) {
               throw new Error(`Путь "${check.value}" не найден`);
             }
          } else if (check.type === 'method_exists') {
             // Format: /path.method (e.g. /users.get)
             const [path, method] = check.value.split('.');
             if (!parsedSpec.paths?.[path]?.[method]) {
               throw new Error(`Метод "${method}" для пути "${path}" не найден`);
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
      checkButtonText="Проверить спецификацию"
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
            <SwaggerEditorPanel
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
