import { useState } from 'react';
import { toast } from "sonner";
import { BpmnEditorPanel } from '@/components/editors/bpmn/BpmnEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';

interface BpmnLessonViewProps {
  lesson: any;
}

export function BpmnLessonView({ lesson }: BpmnLessonViewProps) {
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

      const parser = new DOMParser();
      const doc = parser.parseFromString(code, "text/xml");
      const parserError = doc.getElementsByTagName("parsererror");
      if (parserError.length > 0) {
          throw new Error("Некорректный формат BPMN диаграммы");
      }

      const tasks = doc.getElementsByTagNameNS("*", "task").length + 
                    doc.getElementsByTagNameNS("*", "userTask").length +
                    doc.getElementsByTagNameNS("*", "serviceTask").length +
                    doc.getElementsByTagNameNS("*", "sendTask").length +
                    doc.getElementsByTagNameNS("*", "receiveTask").length;
                    
      const startEvents = doc.getElementsByTagNameNS("*", "startEvent").length;
      const endEvents = doc.getElementsByTagNameNS("*", "endEvent").length;
      
      const gateways = doc.getElementsByTagNameNS("*", "exclusiveGateway").length +
                       doc.getElementsByTagNameNS("*", "inclusiveGateway").length +
                       doc.getElementsByTagNameNS("*", "parallelGateway").length;

      const flows = doc.getElementsByTagNameNS("*", "sequenceFlow").length;
      const lanes = doc.getElementsByTagNameNS("*", "lane").length;
      const participants = doc.getElementsByTagNameNS("*", "participant").length;

      if (startEvents === 0) {
        throw new Error("Диаграмма должна содержать начальное событие (Start Event)");
      }
      if (endEvents === 0) {
        throw new Error("Диаграмма должна содержать конечное событие (End Event)");
      }
      if (lanes === 0 && participants === 0) {
        throw new Error("Диаграмма должна содержать хотя бы один пул или дорожку (Pool/Lane)");
      }
      if (flows === 0 && (tasks + gateways + startEvents + endEvents) > 1) {
        throw new Error("Элементы диаграммы должны быть соединены потоками управления (Sequence Flow)");
      }

      const sequenceFlows = Array.from(doc.getElementsByTagNameNS("*", "sequenceFlow"));
      const sourceRefs = new Set(sequenceFlows.map(flow => flow.getAttribute("sourceRef")));
      const targetRefs = new Set(sequenceFlows.map(flow => flow.getAttribute("targetRef")));

      const startEventElements = Array.from(doc.getElementsByTagNameNS("*", "startEvent"));
      for (const el of startEventElements) {
          if (!sourceRefs.has(el.getAttribute("id") || "")) {
              throw new Error("Начальное событие должно иметь исходящий поток управления");
          }
      }

      const endEventElements = Array.from(doc.getElementsByTagNameNS("*", "endEvent"));
      for (const el of endEventElements) {
          if (!targetRefs.has(el.getAttribute("id") || "")) {
              throw new Error("Конечное событие должно иметь входящий поток управления");
          }
      }

      if (config.mode === 'manual') {
        const checks = config.checks || [];
        for (const check of checks) {
          const expected = parseInt(check.value);
          const operator = check.operator || '=';
          const opText = getOperatorText(operator);
          const suffix = opText ? ` (${opText})` : '';

          if (check.type === 'element_count') {
            let count = 0;
            if (check.element === 'startEvent') count = startEvents;
            else if (check.element === 'endEvent') count = endEvents;
            else if (check.element === 'task') count = tasks;
            else if (check.element === 'gateway') count = gateways;
            else if (check.element === 'lane') count = lanes;
            else if (check.element === 'participant') count = participants;
            else {
                count = (code.match(new RegExp(`<bpmn:${check.element}`, 'g')) || []).length;
            }

            if (!checkValue(count, expected, operator)) {
              throw new Error(`Ожидалось элементов ${check.element}: ${expected}${suffix}, найдено: ${count}`);
            }
          } else if (check.type === 'connection_count') {
             if (!checkValue(flows, expected, operator)) {
               throw new Error(`Ожидалось связей: ${expected}${suffix}, найдено: ${flows}`);
             }
          } else if (check.type === 'contains_text') {
             if (!code.includes(check.value)) {
               throw new Error(`Диаграмма должна содержать элемент с текстом: "${check.value}"`);
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
