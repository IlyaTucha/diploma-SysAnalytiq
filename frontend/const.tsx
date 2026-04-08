import { FileText, Code } from 'lucide-react';

export const lessonTypes = [
  { value: 'theory', label: 'Теория', icon: <FileText className="w-4 h-4" /> },
  { value: 'practice', label: 'Практика', icon: <Code className="w-4 h-4" /> },
];

export const getTypeIcon = (type: string) => {
  return lessonTypes.find(t => t.value === type)?.icon;
};

export const MODULE_NAMES = {
  SQL: 'SQL',
  ERD: 'ERD',
  BPMN: 'BPMN',
  PLANTUML: 'PlantUML',
  SWAGGER: 'Swagger',
};

export const MODULE_SLUGS = {
  SQL: 'sql',
  ERD: 'erd',
  BPMN: 'bpmn',
  PLANTUML: 'plantuml',
  SWAGGER: 'swagger',
};

export const moduleOrder = [
  MODULE_NAMES.SQL,
  MODULE_NAMES.ERD,
  MODULE_NAMES.BPMN,
  MODULE_NAMES.PLANTUML,
  MODULE_NAMES.SWAGGER
];

export const moduleSlugOrder = ['sql', 'er', 'erd', 'bpmn', 'plantuml', 'swagger'];
