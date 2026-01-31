import { lessonsData } from './LessonsMock';
import { Submission } from '@/types/submission';

// Helper to get task description from lessons data
const getTaskDescription = (lessonTitle: string): string => {
  const lesson = lessonsData.find(l => l.title === lessonTitle);
  return lesson ? lesson.content : 'Описание задания не найдено';
};

export const reviewsData: Submission[] = [
  {
    id: 1,
    studentId: '1',
    lessonId: '550e8400-e29b-41d4-a716-446655440002',
    moduleId: 1,
    taskDescription: getTaskDescription('Практическое задание SQL'),
    status: 'pending',
    submittedDate: '2023-10-26 10:00',
    studentSolution: 'SELECT * FROM users WHERE id = 1;',
    executionResult: [
      { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' }
    ],
  },
  {
    id: 2,
    studentId: '4',
    lessonId: '550e8400-e29b-41d4-a716-446655440006',
    moduleId: 3, 
    taskDescription: getTaskDescription('Практика BPMN'),
    status: 'approved',
    submittedDate: '2023-10-25 14:30',
    studentSolution: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_1" isExecutable="false">
    <bpmn:startEvent id="StartEvent_1" />
    <bpmn:task id="Task_1" />
    <bpmn:endEvent id="EndEvent_1" />
    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Task_1" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Task_1" targetRef="EndEvent_1" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_1">
      <bpmndi:BPMNShape id="_BPMNShape_StartEvent_2" bpmnElement="StartEvent_1">
        <dc:Bounds x="173" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_1_di" bpmnElement="Task_1">
        <dc:Bounds x="260" y="80" width="100" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_1_di" bpmnElement="EndEvent_1">
        <dc:Bounds x="412" y="102" width="36" height="36" />
      </bpmndi:BPMNShape>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,
    comments: 'Отличная работа!',
  },
  {
    id: 3,
    studentId: '2',
    lessonId: '550e8400-e29b-41d4-a716-446655440008',
    moduleId: 4,
    taskDescription: getTaskDescription('Практика PlantUML'),
    status: 'rejected',
    submittedDate: '2023-10-24 09:15',
    studentSolution: '@startuml\nAlice -> Bob: Hello\n@enduml',
    comments: 'Есть замечания по синтаксису.',
  },
  {
    id: 4,
    studentId: '5',
    lessonId: '550e8400-e29b-41d4-a716-446655440004',
    moduleId: 2,
    taskDescription: getTaskDescription('Практика ERD'),
    status: 'pending',
    submittedDate: '2023-10-26 11:45',
    studentSolution: '// Use DBML\nTable users {\n  id int\n}',
  },
  {
    id: 5,
    studentId: '3',
    lessonId: '550e8400-e29b-41d4-a716-446655440010',
    moduleId: 5,
    taskDescription: getTaskDescription('Практика Swagger'),
    status: 'pending',
    submittedDate: '2023-10-27 15:20',
    studentSolution: `openapi: 3.0.0
info:
  title: Sample API
  description: Optional multiline or single-line description in [CommonMark](http://commonmark.org/help/) or HTML.
  version: 0.1.9
servers:
  - url: http://api.example.com/v1
    description: Optional server description, e.g. Main (production) server
  - url: http://staging-api.example.com
    description: Optional server description, e.g. Internal staging server for testing
paths:
  /users:
    get:
      summary: Returns a list of users.
      description: Optional extended description in CommonMark or HTML.
      responses:
        '200':
          description: A JSON array of user names
          content:
            application/json:
              schema:
                type: array
                items: 
                  type: string`,
  },
  {
    id: 6,
    studentId: '6',
    lessonId: '550e8400-e29b-41d4-a716-446655440002',
    moduleId: 1,
    taskDescription: getTaskDescription('Практическое задание SQL'),
    status: 'pending',
    submittedDate: '2023-10-28 12:00',
    studentSolution: 'SELECT * FROM products;',
    executionResult: [
      { id: 1, name: 'Ноутбук', price: 45000, category: 'Electronics' },
      { id: 2, name: 'Мышь беспроводная', price: 1200, category: 'Electronics' },
      { id: 3, name: 'Клавиатура', price: 2500, category: 'Electronics' }
    ],
  },
];
