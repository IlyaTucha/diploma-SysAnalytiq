import { Code, FileText, Database, GitBranch, Workflow } from 'lucide-react';
import { Module } from '@/types/module';

export const modulesData: Module[] = [
  {
    id: 1,
    slug: 'sql',
    title: 'SQL',
    description: 'Создание и выполнение SQL запросов',
    color: '#10B981',
    icon: Database,
  },
  {
    id: 2,
    slug: 'erd',
    title: 'ERD',
    description: 'Проектирование ER-диаграмм баз данных',
    color: '#EC4899',
    icon: GitBranch,
  },
  {
    id: 3,
    slug: 'bpmn',
    title: 'BPMN',
    description: 'Моделирование бизнес-процессов в нотации BPMN',
    color: '#8B5CF6',
    icon: Workflow,
  },
  {
    id: 4,
    slug: 'plantuml',
    title: 'PlantUML',
    description: 'Создание диаграмм с помощью PlantUML',
    color: '#F59E0B',
    icon: Code,
  },
  {
    id: 5,
    slug: 'swagger',
    title: 'Swagger',
    description: 'Описание API с помощью Swagger/OpenAPI',
    color: '#06B6D4',
    icon: FileText,
  },
];
