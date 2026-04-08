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

      // Утилита подсчёта Swagger-метрик
      const parseSwagger = (spec: any) => {
        const paths = Object.keys(spec?.paths || {});
        const pathCount = paths.length;
        const schemaCount = Object.keys(spec?.components?.schemas || {}).length;
        // Эндпоинты = уникальные комбинации путь+метод
        const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
        let endpointCount = 0;
        const operations: string[] = [];
        for (const p of paths) {
          const methods = Object.keys(spec.paths[p] || {}).filter(m => HTTP_METHODS.includes(m));
          endpointCount += methods.length;
          methods.forEach(m => operations.push(`${m.toUpperCase()} ${p}`));
        }
        return { pathCount, schemaCount, endpointCount, paths, operations };
      };

      const studentStats = parseSwagger(parsedSpec);

      if (config.mode === 'manual') {
        const checks = config.checks || [];
        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'path_count') {
            if (!checkValue(studentStats.pathCount, expected, operator)) {
              throw new Error(`Ожидалось путей: ${expected}${suffix}, найдено: ${studentStats.pathCount}`);
            }
          } else if (check.type === 'schema_count') {
            if (!checkValue(studentStats.schemaCount, expected, operator)) {
              throw new Error(`Ожидалось схем: ${expected}${suffix}, найдено: ${studentStats.schemaCount}`);
            }
          } else if (check.type === 'endpoint_count') {
            if (!checkValue(studentStats.endpointCount, expected, operator)) {
              throw new Error(`Ожидалось эндпоинтов (путь+метод): ${expected}${suffix}, найдено: ${studentStats.endpointCount}`);
            }
          } else if (check.type === 'path_exists') {
             if (!parsedSpec.paths?.[check.target]) {
               throw new Error(`Путь "${check.target}" не найден`);
             }
          } else if (check.type === 'operation_exists' || check.type === 'method_exists') {
             // Format: /path.method (e.g. /users.get)
             const opValue = check.target;
             const dotIdx = opValue.lastIndexOf('.');
             const path = opValue.substring(0, dotIdx);
             const method = opValue.substring(dotIdx + 1);
             if (!parsedSpec.paths?.[path]?.[method]) {
               throw new Error(`Метод "${method}" для пути "${path}" не найден`);
             }
          }
        }
      } else if (config.code) {
        // Режим сравнения с эталонным кодом
        let refSpec: any;
        try {
          refSpec = yaml.load(config.code);
        } catch {
          throw new Error('Ошибка парсинга эталонного решения');
        }
        const refStats = parseSwagger(refSpec);

        if (config.checkPathCount && studentStats.pathCount !== refStats.pathCount) {
          throw new Error(`Ожидалось путей: ${refStats.pathCount}, найдено: ${studentStats.pathCount}`);
        }
        if (config.checkSchemaCount && studentStats.schemaCount !== refStats.schemaCount) {
          throw new Error(`Ожидалось схем: ${refStats.schemaCount}, найдено: ${studentStats.schemaCount}`);
        }
        if (config.checkEndpointCount && studentStats.endpointCount !== refStats.endpointCount) {
          throw new Error(`Ожидалось эндпоинтов: ${refStats.endpointCount}, найдено: ${studentStats.endpointCount}`);
        }
        if (config.checkPathNames) {
          const missingPaths = refStats.paths.filter((p: string) => !studentStats.paths.includes(p));
          if (missingPaths.length > 0) {
            throw new Error(`Отсутствуют пути: ${missingPaths.join(', ')}`);
          }
        }
        if (config.checkOperationNames) {
          const missingOps = refStats.operations.filter((o: string) => !studentStats.operations.includes(o));
          if (missingOps.length > 0) {
            throw new Error(`Отсутствуют операции: ${missingOps.join(', ')}`);
          }
        }
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
