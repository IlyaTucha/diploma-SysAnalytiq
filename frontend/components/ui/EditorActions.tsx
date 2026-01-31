import { Button } from './button';
import { RotateCcw } from 'lucide-react';
import React from 'react';

interface EditorAction {
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  disabled?: boolean;
  title?: string;
}

interface EditorActionsProps {
  actions: EditorAction[];
  onReset?: () => void;
  resetLabel?: string;
  resetTitle?: string;
}

export const EditorActions: React.FC<EditorActionsProps> = ({ actions, onReset, resetLabel = 'Сбросить', resetTitle = 'Сбросить' }) => (
  <div className="flex gap-2">
    {actions.map((action, idx) => (
      <Button
        key={idx}
        size="sm"
        variant={action.variant || 'ghost'}
        onClick={action.onClick}
        disabled={action.disabled}
        title={action.title || action.label}
      >
        {action.icon}
        {action.label}
      </Button>
    ))}
    {onReset && (
      <Button
        onClick={onReset}
        size="sm"
        variant="outline"
        className="h-8"
        title={resetTitle}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        {resetLabel}
      </Button>
    )}
  </div>
);
