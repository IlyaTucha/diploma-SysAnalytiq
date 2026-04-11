import { useState } from 'react';
import { toast } from "sonner";
import { BpmnEditorPanel } from '@/components/editors/bpmn/BpmnEditorPanel';
import { LessonLayout } from '@/components/layouts/LessonLayout';
import { useLessonNavigation } from '../UseLessonNavigation';
import { checkValue, getOperatorText } from '@/components/ui/operator-selector';
import { lessonsApi } from '@/lib/api';

interface BpmnLessonViewProps {
  lesson: any;
}

export function BpmnLessonView({ lesson }: BpmnLessonViewProps) {
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
      const validationData = await lessonsApi.getValidationConfig(lesson.slug);
      if (!validationData) {
        throw new Error('Ошибка конфигурации валидации');
      }
      const config = validationData.config || { mode: 'code', code: '' };

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

      // Проверка: все задачи и шлюзы должны иметь хотя бы одно соединение
      const flowElements = [
        ...Array.from(doc.getElementsByTagNameNS("*", "task")),
        ...Array.from(doc.getElementsByTagNameNS("*", "userTask")),
        ...Array.from(doc.getElementsByTagNameNS("*", "serviceTask")),
        ...Array.from(doc.getElementsByTagNameNS("*", "sendTask")),
        ...Array.from(doc.getElementsByTagNameNS("*", "receiveTask")),
        ...Array.from(doc.getElementsByTagNameNS("*", "exclusiveGateway")),
        ...Array.from(doc.getElementsByTagNameNS("*", "inclusiveGateway")),
        ...Array.from(doc.getElementsByTagNameNS("*", "parallelGateway")),
      ];
      for (const el of flowElements) {
        const id = el.getAttribute("id") || "";
        if (!sourceRefs.has(id) && !targetRefs.has(id)) {
          const name = el.getAttribute("name") || id;
          throw new Error(`Элемент «${name}» не соединён ни одним потоком управления`);
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
          } else if (check.type === 'connection_count' || check.type === 'edge_count') {
             if (!checkValue(flows, expected, operator)) {
               throw new Error(`Ожидалось связей: ${expected}${suffix}, найдено: ${flows}`);
             }
          } else if (check.type === 'node_count') {
             const nodeCount = tasks + startEvents + endEvents + gateways;
             if (!checkValue(nodeCount, expected, operator)) {
               throw new Error(`Ожидалось узлов: ${expected}${suffix}, найдено: ${nodeCount}`);
             }
          } else if (check.type === 'node_exists' || check.type === 'contains_text') {
             if (!code.includes(check.target)) {
               throw new Error(`Диаграмма должна содержать элемент: "${check.target}"`);
             }
          } else if (check.type === 'lane_count') {
             const laneCount = lanes > 0 ? lanes : participants;
             if (!checkValue(laneCount, expected, operator)) {
               throw new Error(`Ожидалось дорожек: ${expected}${suffix}, найдено: ${laneCount}`);
             }
          } else if (check.type === 'gateway_count') {
             if (!checkValue(gateways, expected, operator)) {
               throw new Error(`Ожидалось шлюзов: ${expected}${suffix}, найдено: ${gateways}`);
             }
          }
        }
      } else if (config.code) {
        // Режим сравнения с эталонным кодом
        const bpmnTypeLabels: Record<string, string> = {
          'participant': 'пул',
          'lane': 'дорожка',
          'task': 'задача',
          'userTask': 'задача',
          'serviceTask': 'задача',
          'sendTask': 'задача',
          'receiveTask': 'задача',
          'startEvent': 'начальное событие',
          'endEvent': 'конечное событие',
          'exclusiveGateway': 'шлюз',
          'inclusiveGateway': 'шлюз',
          'parallelGateway': 'шлюз',
        };
        const parseBpmn = (xmlStr: string) => {
          const d = parser.parseFromString(xmlStr, "text/xml");
          const t = d.getElementsByTagNameNS("*", "task").length + 
                    d.getElementsByTagNameNS("*", "userTask").length +
                    d.getElementsByTagNameNS("*", "serviceTask").length +
                    d.getElementsByTagNameNS("*", "sendTask").length +
                    d.getElementsByTagNameNS("*", "receiveTask").length;
          const se = d.getElementsByTagNameNS("*", "startEvent").length;
          const ee = d.getElementsByTagNameNS("*", "endEvent").length;
          const g = d.getElementsByTagNameNS("*", "exclusiveGateway").length +
                    d.getElementsByTagNameNS("*", "inclusiveGateway").length +
                    d.getElementsByTagNameNS("*", "parallelGateway").length;
          const f = d.getElementsByTagNameNS("*", "sequenceFlow").length;
          const la = d.getElementsByTagNameNS("*", "lane").length;
          const pa = d.getElementsByTagNameNS("*", "participant").length;
          // Собираем имена элементов с типами
          const namedElements: { name: string; type: string }[] = [];
          const allElements = d.getElementsByTagNameNS("*", "*");
          for (let i = 0; i < allElements.length; i++) {
            const name = allElements[i].getAttribute("name");
            if (name) {
              const localName = allElements[i].localName;
              namedElements.push({ name, type: localName });
            }
          }
          return { nodeCount: t + se + ee + g, edgeCount: f, laneCount: la > 0 ? la : pa, gatewayCount: g, namedElements };
        };

        const refStats = parseBpmn(config.code);

        if (config.checkNodeCount) {
          const studentNodeCount = tasks + startEvents + endEvents + gateways;
          if (studentNodeCount !== refStats.nodeCount) {
            throw new Error(`Ожидалось узлов: ${refStats.nodeCount}, найдено: ${studentNodeCount}`);
          }
        }
        if (config.checkEdgeCount && flows !== refStats.edgeCount) {
          throw new Error(`Ожидалось связей: ${refStats.edgeCount}, найдено: ${flows}`);
        }
        const studentLaneCount = lanes > 0 ? lanes : participants;
        if (config.checkLaneCount && studentLaneCount !== refStats.laneCount) {
          throw new Error(`Ожидалось дорожек: ${refStats.laneCount}, найдено: ${studentLaneCount}`);
        }
        if (config.checkGatewayCount && gateways !== refStats.gatewayCount) {
          throw new Error(`Ожидалось шлюзов: ${refStats.gatewayCount}, найдено: ${gateways}`);
        }
        if (config.checkNodeNames) {
          // Собираем имена элементов студента
          const studentNames: string[] = [];
          const allElements = doc.getElementsByTagNameNS("*", "*");
          for (let i = 0; i < allElements.length; i++) {
            const name = allElements[i].getAttribute("name");
            if (name) studentNames.push(name);
          }
          const studentNamesLower = studentNames.map(n => n.toLowerCase());
          const missingElements = refStats.namedElements.filter((el: { name: string }) => !studentNamesLower.includes(el.name.toLowerCase()));
          if (missingElements.length > 0) {
            const items = missingElements.slice(0, 3).map((el: { name: string; type: string }) => {
              const typeLabel = bpmnTypeLabels[el.type] || 'элемент';
              return `${typeLabel} «${el.name}»`;
            });
            const suffix = missingElements.length > 3 ? '...' : '';
            throw new Error(`Отсутствуют: ${items.join(', ')}${suffix}`);
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
