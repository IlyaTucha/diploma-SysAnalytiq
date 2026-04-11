import { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from "sonner";
import { ErdEditorPanel, ErdEditorPanelRef } from '@/components/editors/erd/ErdEditorPanel';
import { ErdLayout } from '@/components/editors/erd/ErdDiagram';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';
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

  // Load saved layout from existing submission
  const existingSubmission = lessonId ? submissions.find(s => s.lessonId === lessonId) : undefined;
  const savedLayout: ErdLayout | null = existingSubmission?.executionResult?.nodePositions
    ? existingSubmission.executionResult as ErdLayout
    : null;

  const handleCheck = async (code: string) => {
    setError(null);
    
    if (!lesson?.slug) {
      setError('Lesson slug not found');
      return false;
    }
    
    try {
      const validationData = await lessonsApi.getValidationConfig(lesson.slug);
      if (!validationData) {
        throw new Error('Failed to fetch validation config');
      }
      const config = validationData.config || { mode: 'code', code: '' };

      const parseDbml = (dbml: string) => {
        const tables: Record<string, { columns: Record<string, string> }> = {};
        const lines = dbml.split('\n');
        let currentTable = '';
        let inlineRefCount = 0;
        
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
            // Подсчёт inline refs: [ref: > table.col]
            const inlineRefs = trimmed.match(/\[.*ref\s*:/gi);
            if (inlineRefs) {
              inlineRefCount += inlineRefs.length;
            }
          }
        });
        
        // Подсчет связей: Ref: на отдельных строках + inline refs в колонках
        const standaloneRefs = (dbml.match(/^Ref\s*:/gm) || []).length;
        const relationships = standaloneRefs + inlineRefCount;
        
        return { tables, relationships };
      };

      // Базовая проверка DBML синтаксиса
      if (!code.trim()) {
        throw new Error('Код схемы пустой');
      }

      const openBraces = (code.match(/{/g) || []).length;
      const closeBraces = (code.match(/}/g) || []).length;
      if (openBraces !== closeBraces) {
        throw new Error(`Несоответствие фигурных скобок: открывающих ${openBraces}, закрывающих ${closeBraces}`);
      }

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
             if (!studentSchema.tables[check.target]) {
               throw new Error(`Таблица "${check.target}" не найдена`);
             }
          } else if (check.type === 'column_exists') {
             // Format: TableName.ColumnName
             const colRef = check.target;
             const [tableName, colName] = colRef.split('.');
             if (!studentSchema.tables[tableName]) {
               throw new Error(`Таблица "${tableName}" не найдена`);
             }
             if (!studentSchema.tables[tableName].columns[colName]) {
               throw new Error(`Колонка "${colName}" в таблице "${tableName}" не найдена`);
             }
          }
        }
      } else {
         // Code comparison mode — compare student schema against reference code
         const referenceCode = config.code || '';
         if (!referenceCode) {
           throw new Error('Эталонный код не задан в конфигурации урока');
         }
         const referenceSchema = parseDbml(referenceCode);

         if (config.checkTableCount) {
           const expected = Object.keys(referenceSchema.tables).length;
           const actual = Object.keys(studentSchema.tables).length;
           if (actual !== expected) {
             throw new Error(`Ожидалось таблиц: ${expected}, найдено: ${actual}`);
           }
         }

         if (config.checkRelationshipCount) {
           const expected = referenceSchema.relationships;
           const actual = studentSchema.relationships;
           if (actual !== expected) {
             throw new Error(`Ожидалось связей: ${expected}, найдено: ${actual}`);
           }
         }

         if (config.checkTableNames) {
           const refTableNames = Object.keys(referenceSchema.tables).map(n => n.toLowerCase()).sort();
           const studentTableNames = Object.keys(studentSchema.tables).map(n => n.toLowerCase()).sort();
           const missing = refTableNames.filter(n => !studentTableNames.includes(n));
           if (missing.length > 0) {
             throw new Error(`Не найдены таблицы: ${missing.join(', ')}`);
           }
         }

         if (config.checkColumnNames) {
           for (const [tableName, tableData] of Object.entries(referenceSchema.tables)) {
             const studentTable = Object.entries(studentSchema.tables).find(
               ([name]) => name.toLowerCase() === tableName.toLowerCase()
             );
             if (!studentTable) {
               throw new Error(`Таблица "${tableName}" не найдена`);
             }
             const refCols = Object.keys((tableData as any).columns).map(c => c.toLowerCase());
             const studentCols = Object.keys(studentTable[1].columns).map(c => c.toLowerCase());
             const missingCols = refCols.filter(c => !studentCols.includes(c));
             if (missingCols.length > 0) {
               throw new Error(`В таблице "${tableName}" не найдены колонки: ${missingCols.join(', ')}`);
             }
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
