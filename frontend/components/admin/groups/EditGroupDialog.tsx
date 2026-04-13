import { useState, useEffect } from 'react';
import { Trash2, Save, Eye, EyeOff, Copy } from 'lucide-react';
import { toast } from "sonner";
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Group } from '@/types/group';
import { User } from '@/types/user';
import { VKProfileLink } from '@/components/ui/ProfileLinks';
import { groupsApi } from '@/lib/api';

interface EditGroupDialogProps {
  group: Group | null;
  users: User[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveUser: (user: User) => void;
  onDeleteGroup: () => void;
  onGroupUpdated?: (group: Group) => void;
}

export function EditGroupDialog({ 
  group, 
  users, 
  isOpen, 
  onOpenChange, 
  onRemoveUser, 
  onDeleteGroup,
  onGroupUpdated,
}: EditGroupDialogProps) {
  const [password, setPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (group) {
      setPassword('');
      setShowPassword(false);
    }
  }, [group]);

  if (!group) return null;

  const handleSavePassword = async () => {
    setIsSaving(true);
    try {
      const updated = await groupsApi.update(group.id, { password });
      toast.success('Пароль группы обновлён');
      if (onGroupUpdated) onGroupUpdated(updated as unknown as Group);
    } catch {
      toast.error('Ошибка обновления пароля');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Управление группой {group.name}</DialogTitle>
          <DialogDescription>
            Пароль группы и управление составом
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={(e) => { e.preventDefault(); handleSavePassword(); }} className="space-y-2 py-2">
          <span className="text-base font-medium select-text cursor-text">Пароль группы</span>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="group-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={group.hasPassword ? "Пароль установлен (введите новый для замены)" : "Без пароля"}
                className="pr-16"
                autoComplete="off"
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                {password && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => {
                      navigator.clipboard.writeText(password);
                      toast.success('Пароль скопирован');
                    }}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
            <Button size="sm" onClick={handleSavePassword} disabled={isSaving}>
              <Save className="h-4 w-4 mr-1" />
              Сохранить
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Оставьте пустым, если пароль не требуется</p>
        </form>

        <ScrollArea className="flex-1 pr-4 mt-2 h-[50vh]">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-medium text-muted-foreground">
                  Студенты ({users.length})
               </h3>
            </div>

            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                 <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  <div>
                      <div className="font-medium">{user.name}</div>
                      <VKProfileLink url={user.vkProfileUrl} name={user.name} className="text-xs" />
                  </div>
                 </div>
                 <Button 
                   variant="ghost" 
                   size="icon" 
                   className="text-destructive hover:text-destructive hover:bg-destructive/10"
                   onClick={() => onRemoveUser(user)}
                 >
                   <Trash2 className="h-4 w-4" />
                 </Button>
              </div>
            ))}
            
            {users.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                  В этой группе пока нет студентов.
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t border-border flex justify-end">
            <Button 
              variant="destructive" 
              onClick={onDeleteGroup}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить группу
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
