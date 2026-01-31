import { useState } from 'react';
import { toast } from "sonner";
import { ErdEditorPanel } from '@/components/editors/erd/ErdEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';

interface ErdLessonViewProps {
  lesson: any;
}

export function ErdLessonView({ lesson }: ErdLessonViewProps) {
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

      const parseDbml = (dbml: string) => {
        const tables: Record<string, { columns: Record<string, string> }> = {};
        const lines = dbml.split('\n');
        let currentTable = '';
        
        lines.forEach(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('Table')) {
            const match = trimmed.match(/Table\s+(\w+)/);
            if (match) {
              currentTable = match[1];
              tables[currentTable] = { columns: {} };
            }
          } else if (trimmed.startsWith('}')) {
            currentTable = '';
          } else if (currentTable && trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('Note') && !trimmed.startsWith('Ref:')) {
            // Парсинг колонки: имя тип [настройки]
            const parts = trimmed.split(/\s+/);
            if (parts.length >= 2) {
              const name = parts[0];
              const type = parts[1];
              tables[currentTable].columns[name] = type;
            }
          }
        });
        
        // Подсчет связей (Ref:)
        const relationships = (dbml.match(/Ref:/g) || []).length;
        
        return { tables, relationships };
      };

      const studentSchema = parseDbml(code);

      if (config.mode === 'manual') {
        const checks = config.checks || [];
        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'table_count') {
            const actual = Object.keys(studentSchema.tables).length;
            if (!checkValue(actual, expected, operator)) {
              throw new Error(`Ожидалось таблиц: ${expected}${suffix}, найдено: ${actual}`);
            }
          } else if (check.type === 'relationship_count') {
            if (!checkValue(studentSchema.relationships, expected, operator)) {
              throw new Error(`Ожидалось связей: ${expected}${suffix}, найдено: ${studentSchema.relationships}`);
            }
          } else if (check.type === 'table_exists') {
             if (!studentSchema.tables[check.value]) {
               throw new Error(`Таблица "${check.value}" не найдена`);
             }
          } else if (check.type === 'column_exists') {
             // Format: TableName.ColumnName
             const [tableName, colName] = check.value.split('.');
             if (!studentSchema.tables[tableName]) {
               throw new Error(`Таблица "${tableName}" не найдена`);
             }
             if (!studentSchema.tables[tableName].columns[colName]) {
               throw new Error(`Колонка "${colName}" в таблице "${tableName}" не найдена`);
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
      checkButtonText="Проверить схему"
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
            <ErdEditorPanel
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
