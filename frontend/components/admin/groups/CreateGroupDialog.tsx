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
  onCreate: (name: string, password: string) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateGroupDialog({ onCreate, isOpen, onOpenChange }: CreateGroupDialogProps) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPassword, setNewGroupPassword] = useState('');
  const [isInputError, setIsInputError] = useState(false);

  const handleCreate = () => {
    if (!newGroupName.trim()) {
      setIsInputError(true);
      toast.error('Название группы не может быть пустым');
      return;
    }
    onCreate(newGroupName, newGroupPassword);
    setNewGroupName('');
    setNewGroupPassword('');
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
            Введите название группы и пароль. Студенты смогут присоединиться по ссылке и паролю.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Название <span className="text-destructive">*</span>
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
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Пароль
            </Label>
            <Input
              id="password"
              type="text"
              value={newGroupPassword}
              onChange={(e) => setNewGroupPassword(e.target.value)}
              placeholder="необязательно"
              className="col-span-3"
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
