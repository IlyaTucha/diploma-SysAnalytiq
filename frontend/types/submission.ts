import { Comment } from './comment';

export interface Submission {
  id: number;
  studentId: string;
  lessonId: string;
  moduleId: number;
  taskDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  studentSolution: string;
  executionResult?: any;
  comments?: string;
  inlineComments?: Comment[];
}
