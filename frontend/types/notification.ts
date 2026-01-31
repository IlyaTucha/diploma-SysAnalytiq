import { User } from './user';

export type NotificationType = 'approved' | 'rejected';

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
  lessonPath: string;
  startLine?: number;
  endLine?: number;
  isRead: boolean;
}
