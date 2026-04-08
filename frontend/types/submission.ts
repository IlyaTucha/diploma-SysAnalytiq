import { Comment } from './comment';

export interface Submission {
  id: number;
  studentId: string;
  studentName?: string;
  studentTelegramUsername?: string;
  studentGroupId?: string;
  lessonId: string;
  moduleId: number;
  taskDescription: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  studentSolution: string;
  executionResult?: any;
  comments?: string;
  inlineComments?: Comment[];
  attemptCount?: number;
  reviewHistory?: Array<{
    status: string;
    feedback: string;
    reviewerName: string;
    reviewedAt: string;
    inlineComments: any[];
  }>;
}
