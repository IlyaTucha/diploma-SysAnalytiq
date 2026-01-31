import { Button } from './button';
import { Undo, Redo } from 'lucide-react';

interface UndoRedoControlsProps {
  onUndo: () => void;
  onRedo: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  variant?: 'outline' | 'ghost' | 'secondary';
  className?: string;
}

export const UndoRedoControls = ({ 
  onUndo, 
  onRedo, 
  canUndo = true, 
  canRedo = true,
  variant = 'outline',
  className 
}: UndoRedoControlsProps) => {
  return (
    <div className={`flex gap-1 ${className || ''}`}>
      <Button 
        size="sm" 
        variant={variant}
        onClick={onUndo}
        disabled={!canUndo}
        title="Отменить (CTRL+Z)"
        className="h-8 w-8 p-0"
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button 
        size="sm" 
        variant={variant}
        onClick={onRedo}
        disabled={!canRedo}
        title="Повторить (CTRL+Y)"
        className="h-8 w-8 p-0"
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};
