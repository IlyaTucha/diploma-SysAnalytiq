import { User } from './user';

export type NotificationType = 'approved' | 'rejected' | 'pending';

export interface Notification {
  id: string;
  type: NotificationType;
  reviewer: User;
  moduleName: string;
  lessonTitle: string;
  reviewDate: string;
  generalComment?: string;
  highlightedCode?: string;
  inlineComment?: string;
  startLine?: number;
  endLine?: number;
  inlineComments?: Array<{
    lineStart: number;
    lineEnd: number;
    highlightedText: string;
    text: string;
  }>;
  lessonPath: string;
  isRead: boolean;
}
