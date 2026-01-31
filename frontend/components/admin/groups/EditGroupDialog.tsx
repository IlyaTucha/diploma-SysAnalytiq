import { Trash2 } from 'lucide-react';
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
import { Group } from '@/types/group';
import { User } from '@/types/user';

interface EditGroupDialogProps {
  group: Group | null;
  users: User[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveUser: (user: User) => void;
  onDeleteGroup: () => void;
}

export function EditGroupDialog({ 
  group, 
  users, 
  isOpen, 
  onOpenChange, 
  onRemoveUser, 
  onDeleteGroup 
}: EditGroupDialogProps) {
  
  if (!group) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>Управление группой {group.name}</DialogTitle>
          <DialogDescription>
            Список студентов и управление составом группы
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="flex-1 pr-4 mt-2 h-[50vh]">
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
               <h3 className="text-sm font-medium text-muted-foreground">
                  Студенты ({users.length})
               </h3>
            </div>

            {users.map((user) => (
              <div key={user.email} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                 <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.name.charAt(0)}
                      </AvatarFallback>
                  </Avatar>
                  <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">{user.email}</div>
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
                  В этой группе пока нет студентов
              </div>
            )}
          </div>
        </ScrollArea>
        
        <div className="mt-4 pt-4 border-t border-border flex justify-between">
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
