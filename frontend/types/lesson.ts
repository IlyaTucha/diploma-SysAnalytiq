export interface Lesson {
  id: string;
  moduleId: number;
  number: number;
  title: string;
  type: 'theory' | 'practice';
  slug: string;
  content: string;
  initialCode?: string;
  correctAnswer?: string;
  hint?: string;
  published: boolean;
}
