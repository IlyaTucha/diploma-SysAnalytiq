import { ReactNode } from 'react';
import { cn } from './utils';

interface EditorHeaderProps {
  icon: ReactNode;
  title: string;
  actions?: ReactNode;
  leftActions?: ReactNode;
  rightActions?: ReactNode;
  className?: string;
}

export function EditorHeader({ icon, title, actions, leftActions, rightActions, className = '' }: EditorHeaderProps) {
  return (
    <div className={cn("p-2 border-b bg-muted/20 flex items-center justify-between flex-shrink-0", className)}>
      <div className="flex items-center gap-2">
        {icon}
        <span className="font-medium text-sm">{title}</span>
        {leftActions && <div className="flex items-center gap-1">{leftActions}</div>}
      </div>
      <div className="flex items-center gap-1">
        {actions || rightActions}
      </div>
    </div>
  );
}
