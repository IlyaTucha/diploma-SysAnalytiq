import React, { useState, useRef } from 'react';
import { toast } from "sonner";
import { SqlEditorPanel } from '@/components/editors/sql/SqlEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useSqlRunner } from '@/components/editors/sql/hooks/UseSqlRunner';
import { OnMount } from '@monaco-editor/react';
import { useLessonNavigation } from '@/components/lessons/UseLessonNavigation';
import { Database } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockDatasets, schemaMetadata } from '@/mocks/SqlMock';

interface SqlLessonViewProps {
  lesson: any;
}

export function SqlLessonView({ lesson }: SqlLessonViewProps) {
  const { nextLink, prevLink, nextLabel, prevLabel } = useLessonNavigation();

  const content = lesson;

  const { db, error: runnerError, executeQuery } = useSqlRunner();
  const [result, setResult] = useState<any>(null);
  const [validationState, setValidationState] = useState<'idle' | 'success' | 'error'>('idle');
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const editorRef = useRef<any>(null);

  // Сбрасываем локальное состояние при переключении задания
  const lessonId = lesson?.id;
  React.useEffect(() => {
    setResult(null);
    setValidationState('idle');
    setValidationMessage(null);
  }, [lessonId]);

  const handleEditorDidMount: OnMount = (editor, _monaco) => {
    editorRef.current = editor;
  };

  const compareResults = (student: any[], teacher: any[]) => {
    if (student.length === 0 && teacher.length > 0) return "Ваш запрос не вернул данных, хотя должен был.";
    
    const studentCols = Object.keys(student[0] || {});
    const teacherCols = Object.keys(teacher[0] || {});
    
    const missingCols = teacherCols.filter(c => !studentCols.includes(c));
    if (missingCols.length > 0) {
        return "В результате отсутствуют необходимые колонки: " + missingCols.join(', ');
    }

    if (student.length > teacher.length) {
        return "Результат содержит слишком много строк (" + student.length + " вместо " + teacher.length + "). Возможно, условия фильтрации слишком мягкие или отсутствуют.";
    }
    if (student.length < teacher.length) {
        return "Результат содержит недостаточно строк (" + student.length + " вместо " + teacher.length + "). Возможно, условия фильтрации слишком жесткие.";
    }

    if (JSON.stringify(student) !== JSON.stringify(teacher)) {
        return "Количество строк совпадает, но данные внутри отличаются. Проверьте порядок выборки или сортировку.";
    }

    return null;
  };

  const handleRun = (code: string) => {
    if (!db) return;
    const res = executeQuery(code);
    setResult(res);
    setValidationState('idle');
    setValidationMessage(null);
  };

  const handleCheck = (code: string) => {
    if (!db) return false;
    
    const studentResult = executeQuery(code);
    setResult(studentResult);
    
    if (!studentResult || !Array.isArray(studentResult)) {
        setValidationState('error');
        setValidationMessage('Ошибка выполнения запроса.');
        return false;
    }

    const teacherCode = lesson?.correctAnswer;
    
    if (teacherCode) {
        const teacherResult = executeQuery(teacherCode);
        
        if (!teacherResult || !Array.isArray(teacherResult)) {
             console.error("Teacher solution failed:", teacherResult);
             setValidationState('error');
             setValidationMessage('Ошибка проверки: эталонное решение неверно.');
             return false;
        }

        const errorMsg = compareResults(studentResult, teacherResult);

        if (!errorMsg) {
            setValidationState('success');
            setValidationMessage('Отлично! Ваше решение верно.');
            toast.success("Задание выполнено!");
            return true;
        } else {
            setValidationState('error');
            setValidationMessage(errorMsg);
            return false;
        }
    }
    
    return false;
  };

  const handleReset = () => {
      setResult(null);
      setValidationState('idle');
      setValidationMessage(null);
  };

  return (
    <LessonLayout
      lessonTitle={content.title}
      task={content.content || ''}
      initialCode={content.initialCode || ''}
      onCheck={handleCheck}
      hint={content.hint}
      checkButtonText="Проверить решение"
      submissionExtra={{ executionResult: result }}
      backLink={prevLink}
      nextLink={nextLink}
      backLabel={prevLabel}
      nextLabel={nextLabel}
      renderEditor={(code, setCode) => (
        <ResizablePanelGroup direction="horizontal" className="h-full">
          <ResizablePanel defaultSize={20} minSize={18} maxSize={30} className="bg-muted/10 border-r hidden md:block">
            <div className="flex flex-col h-full">
              <div className="p-3 border-b bg-muted/20">
                <h3 className="font-semibold text-xs flex items-center gap-2">
                  <Database className="w-3.5 h-3.5" />
                  Схема БД
                </h3>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2">
                  <Accordion type="single" collapsible className="w-full">
                    {Object.keys(mockDatasets).map((tableName) => (
                      <AccordionItem key={tableName} value={tableName} className="border-b-0">
                        <AccordionTrigger className="text-xs py-1.5 hover:no-underline hover:bg-muted/50 px-2 rounded">
                          <div className="flex items-center gap-2">
                            <Database className="w-3 h-3 text-muted-foreground" />
                            {tableName}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="pl-4 space-y-0.5 mt-0.5">
                            {Object.keys(mockDatasets[tableName as keyof typeof mockDatasets][0]).map((col) => {
                              const isPK = schemaMetadata[tableName]?.pk.includes(col);
                              const isFK = !!schemaMetadata[tableName]?.fks[col];
                              
                              return (
                              <div key={col} className="flex items-center justify-between text-[10px] py-1 px-2 rounded hover:bg-muted/50 cursor-pointer group"
                                    onClick={() => {
                                      setCode(`${code}\n-- Column: ${col}\nSELECT ${col} FROM ${tableName} LIMIT 5;`);
                                    }}>
                                <div className="flex items-center gap-1.5">
                                  {isPK && <span className="font-bold text-yellow-600 dark:text-yellow-500" title="Primary Key">PK</span>}
                                  {isFK && <span className="font-bold text-blue-600 dark:text-blue-500" title={`Foreign Key -> ${schemaMetadata[tableName].fks[col]}`}>FK</span>}
                                  <span className="font-mono text-muted-foreground group-hover:text-foreground transition-colors">{col}</span>
                                </div>
                                <Badge variant="outline" className="text-[9px] h-3.5 px-0.5 text-muted-foreground">
                                  {typeof (mockDatasets[tableName as keyof typeof mockDatasets][0] as any)[col] === 'number' ? 'int' : 'varchar'}
                                </Badge>
                              </div>
                              );
                            })}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </ScrollArea>
            </div>
          </ResizablePanel>
          
          <ResizableHandle className="hidden md:flex" />

          <ResizablePanel defaultSize={80}>
            <SqlEditorPanel
              sqlCode={code}
              setSqlCode={setCode}
              handleRunQuery={handleRun}
              handleReset={() => {
                  setCode(content.initialCode || '');
                  handleReset();
              }}
              result={result}
              handleEditorDidMount={handleEditorDidMount}
              validationState={runnerError ? 'error' : validationState}
              validationMessage={runnerError || validationMessage}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      )}
    />
  );
}
