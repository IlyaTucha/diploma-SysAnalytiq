import { useState } from 'react';
import { toast } from "sonner";
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface CreateGroupDialogProps {
  onCreate: (name: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ onCreate, isOpen, onOpenChange }: CreateGroupDialogProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [isInputError, setIsInputError] = useState(false);

  const handleCreate = () => {
    if (!newGroupName.trim()) {
      setIsInputError(true);
      toast.error('Название группы не может быть пустым');
      return;
    }
    onCreate(newGroupName);
    setNewGroupName('');
    setIsInputError(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Добавить группу
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Создание новой группы</DialogTitle>
          <DialogDescription>
            Введите название группы. Студенты смогут присоединиться к ней по ссылке.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Название
            </Label>
            <Input
              id="name"
              value={newGroupName}
              onChange={(e) => {
                setNewGroupName(e.target.value);
                if (e.target.value.trim()) setIsInputError(false);
              }}
              placeholder="например, Весна-2026"
              className={`col-span-3 ${isInputError ? 'border-destructive' : ''}`}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate}>Создать группу</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
