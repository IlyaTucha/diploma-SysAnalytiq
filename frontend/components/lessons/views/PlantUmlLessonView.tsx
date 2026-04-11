import { useState } from 'react';
import { toast } from "sonner";
import { PlantUmlEditorPanel } from '@/components/editors/plantuml/PlantUmlEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';
import { lessonsApi } from '@/lib/api';

interface PlantUmlLessonViewProps {
  lesson: any;
}

export function PlantUmlLessonView({ lesson }: PlantUmlLessonViewProps) {
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
      // Fetch validation config from API
      const validationData = await lessonsApi.getValidationConfig(lesson.slug);
      if (!validationData) {
        throw new Error('Ошибка получения конфигурации валидации');
      }
      const config = validationData.config || { mode: 'code', code: '' };

      // Базовая проверка PlantUML
      if (!code.trim()) {
        throw new Error('PlantUML код пуст');
      }

      if (!code.includes('@startuml')) {
        throw new Error('PlantUML диаграмма должна начинаться с @startuml');
      }

      if (!code.includes('@enduml')) {
        throw new Error('PlantUML диаграмма должна заканчиваться @enduml');
      }
      // Проверка базовых элементов диаграммы
      const diagramTypes = ["class", "interface", "enum", "component", "actor", "usecase"];
      const hasDiagramElement = diagramTypes.some(element => code.toLowerCase().includes(element));

      if (!hasDiagramElement) {
        throw new Error('PlantUML диаграмма должна содержать хотя бы один элемент диаграммы');
      }

      // Универсальный парсинг PlantUML кода
      const parsePlantUml = (pumlBody: string) => {
        const lines = pumlBody.split('\n').map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith("'") && !l.startsWith('@'));
        const participantCount = lines.filter((l: string) =>
          /^(participant|actor|database|queue|entity|boundary|control|collections)\s+/i.test(l)
        ).length;
        const relationshipCount = lines.filter((l: string) =>
          /\s*-+>|<-+\s*|\.+>|<\.+/.test(l) && !/^(participant|actor|database|queue|entity|boundary|control|collections|note|end|group|loop|alt|else|ref|title|header|footer)\s/i.test(l)
        ).length;
        const classCount = lines.filter((l: string) => /^(class|abstract\s+class)\s+/i.test(l)).length;
        const interfaceCount = lines.filter((l: string) => /^interface\s+/i.test(l)).length;
        const loopCount = lines.filter((l: string) => /^loop\b/i.test(l)).length;
        const altCount = lines.filter((l: string) => /^alt\b/i.test(l)).length;
        return { participantCount, relationshipCount, classCount, interfaceCount, loopCount, altCount };
      };

      const studentStats = parsePlantUml(code);

      if (config.mode === 'manual') {
        const checks = config.checks || [];

        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'participant_count') {
            if (!checkValue(studentStats.participantCount, expected, operator)) {
              throw new Error(`Ожидалось участников: ${expected}${suffix}, найдено: ${studentStats.participantCount}`);
            }
          } else if (check.type === 'message_count' || check.type === 'relationship_count') {
            if (!checkValue(studentStats.relationshipCount, expected, operator)) {
              throw new Error(`Ожидалось связей: ${expected}${suffix}, найдено: ${studentStats.relationshipCount}`);
            }
          } else if (check.type === 'class_count') {
            if (!checkValue(studentStats.classCount, expected, operator)) {
              throw new Error(`Ожидалось классов: ${expected}${suffix}, найдено: ${studentStats.classCount}`);
            }
          } else if (check.type === 'interface_count') {
            if (!checkValue(studentStats.interfaceCount, expected, operator)) {
              throw new Error(`Ожидалось интерфейсов: ${expected}${suffix}, найдено: ${studentStats.interfaceCount}`);
            }
          } else if (check.type === 'loop_count') {
            if (!checkValue(studentStats.loopCount, expected, operator)) {
              throw new Error(`Ожидалось циклов: ${expected}${suffix}, найдено: ${studentStats.loopCount}`);
            }
          } else if (check.type === 'alt_count') {
            if (!checkValue(studentStats.altCount, expected, operator)) {
              throw new Error(`Ожидалось условий: ${expected}${suffix}, найдено: ${studentStats.altCount}`);
            }
          } else if (check.type === 'element_exists' || check.type === 'contains_text') {
             if (!code.includes(check.target)) {
               throw new Error(`Код должен содержать: "${check.target}"`);
             }
          }
        }
      } else if (config.code) {
        // Режим сравнения с эталонным кодом
        const refBody = config.code.match(/@startuml[\s\S]*?@enduml/);
        if (!refBody) {
          throw new Error('Ошибка в эталонном решении');
        }
        const refStats = parsePlantUml(refBody[0]);

        if (config.checkParticipantCount && studentStats.participantCount !== refStats.participantCount) {
          throw new Error(`Ожидалось участников: ${refStats.participantCount}, найдено: ${studentStats.participantCount}`);
        }
        if (config.checkRelationshipCount && studentStats.relationshipCount !== refStats.relationshipCount) {
          throw new Error(`Ожидалось связей: ${refStats.relationshipCount}, найдено: ${studentStats.relationshipCount}`);
        }
        if (config.checkClassCount && studentStats.classCount !== refStats.classCount) {
          throw new Error(`Ожидалось классов: ${refStats.classCount}, найдено: ${studentStats.classCount}`);
        }
        if (config.checkInterfaceCount && studentStats.interfaceCount !== refStats.interfaceCount) {
          throw new Error(`Ожидалось интерфейсов: ${refStats.interfaceCount}, найдено: ${studentStats.interfaceCount}`);
        }
        if (config.checkLoopCount && studentStats.loopCount !== refStats.loopCount) {
          throw new Error(`Ожидалось циклов: ${refStats.loopCount}, найдено: ${studentStats.loopCount}`);
        }
        if (config.checkAltCount && studentStats.altCount !== refStats.altCount) {
          throw new Error(`Ожидалось условий: ${refStats.altCount}, найдено: ${studentStats.altCount}`);
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
