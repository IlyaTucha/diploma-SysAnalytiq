import { useState } from 'react';
import { toast } from "sonner";
import { SwaggerEditorPanel } from '@/components/editors/swagger/SwaggerEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';
import yaml from 'js-yaml';
import { lessonsApi } from '@/lib/api';

interface SwaggerLessonViewProps {
  lesson: any;
}

export function SwaggerLessonView({ lesson }: SwaggerLessonViewProps) {
  const { nextLink, prevLink, nextLabel, prevLabel } = useLessonNavigation();

  const content = lesson;

  const initialCode = content.initialCode || '';

  const [error, setError] = useState<string | null>(null);

  const handleCheck = async (code: string) => {
    setError(null);
    
    if (!lesson?.slug) {
      setError('Lesson slug not found');
      return false;
    }
    
    try {
      // Получить конфигурацию валидации из API
      const validationData = await lessonsApi.getValidationConfig(lesson.slug);
      if (!validationData) {
        throw new Error('Ошибка получения конфигурации валидации');
      }
      const config = validationData.config || { mode: 'code', code: '' };

      // Базовая валидация OpenAPI
      if (!code.trim()) {
        throw new Error('Swagger/OpenAPI код пуст');
      }

      if (!code.toLowerCase().includes('openapi:') && !code.toLowerCase().includes('swagger:')) {
        throw new Error('Должен содержать версию OpenAPI или Swagger');
      }

      // Проверка обязательных элементов OpenAPI
      const requiredElements = ["info", "paths"];
      for (const element of requiredElements) {
        if (!code.toLowerCase().includes(`${element}:`)) {
          throw new Error(`Отсутствует обязательный элемент OpenAPI: ${element}`);
        }
      }

      // Базовая проверка синтаксиса YAML/JSON
      const lines = code.trim().split('\n');
      if (lines.length < 5) {
        throw new Error('Спецификация OpenAPI слишком короткая');
      }

      // Парсинг спецификации OpenAPI для детальной валидации
      let spec: any;
      try {
        // Сначала пробуем парсинг YAML
        if (code.includes(':') && !code.trim().startsWith('{')) {
          spec = yaml.load(code);
        } else {
          // Пробуем парсинг JSON
          spec = JSON.parse(code);
        }
      } catch (e: any) {
        throw new Error('Erreur de syntaxe YAML/JSON: ' + e.message);
      }

      const paths = Object.keys(spec?.paths || {});
      const pathCount = paths.length;
      const schemaCount = Object.keys(spec?.components?.schemas || {}).length;
      
      // Подсчет эндпоинтов (комбинации путь+метод)
      const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
      let endpointCount = 0;
      for (const p of paths) {
        const methods = Object.keys(spec.paths[p] || {}).filter(m => HTTP_METHODS.includes(m));
        endpointCount += methods.length;
      }

      if (config.mode === 'manual') {
        const checks = config.checks || [];
        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'path_count') {
            if (!checkValue(pathCount, expected, operator)) {
              throw new Error(`Ожидалось путей: ${expected}${suffix}, найдено: ${pathCount}`);
            }
          } else if (check.type === 'schema_count') {
            if (!checkValue(schemaCount, expected, operator)) {
              throw new Error(`Ожидалось схем: ${expected}${suffix}, найдено: ${schemaCount}`);
            }
          } else if (check.type === 'endpoint_count') {
            if (!checkValue(endpointCount, expected, operator)) {
              throw new Error(`Ожидалось эндпоинтов: ${expected}${suffix}, найдено: ${endpointCount}`);
            }
          } else if (check.type === 'path_exists') {
            if (!spec.paths?.[check.target]) {
              throw new Error(`Путь "${check.target}" не найден`);
            }
          } else if (check.type === 'operation_exists' || check.type === 'method_exists') {
             // Format: /path.method (e.g. /users.get)
            const opValue = check.target;
            const dotIdx = opValue.lastIndexOf('.');
            const path = opValue.substring(0, dotIdx);
            const method = opValue.substring(dotIdx + 1);
            if (!spec.paths?.[path]?.[method]) {
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

        const refPaths = Object.keys(refSpec?.paths || {});
        const refPathCount = refPaths.length;
        const refSchemaCount = Object.keys(refSpec?.components?.schemas || {}).length;
        let refEndpointCount = 0;
        for (const path of refPaths) {
          const methods = Object.keys(refSpec.paths[path] || {}).filter(m => HTTP_METHODS.includes(m));
          refEndpointCount += methods.length;
        }

        if (config.checkPathCount && pathCount !== refPathCount) {
          throw new Error(`Ожидалось путей: ${refPathCount}, найдено: ${pathCount}`);
        }
        if (config.checkSchemaCount && schemaCount !== refSchemaCount) {
          throw new Error(`Ожидалось схем: ${refSchemaCount}, найдено: ${schemaCount}`);
        }
        if (config.checkEndpointCount && endpointCount !== refEndpointCount) {
          throw new Error(`Ожидалось эндпоинтов: ${refEndpointCount}, найдено: ${endpointCount}`);
        }
      }

      toast.success("Task completed successfully!");
      return true;
    } catch (error: any) {
      setError(error.message || 'Validation error');
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
