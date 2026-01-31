import { useState } from 'react';
import { toast } from "sonner";
import { groupsData } from '@/mocks/GroupsMock';
import { usersData } from '@/mocks/UsersMock';
import { Group } from '@/types/group';
import { User } from '@/types/user';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Users } from 'lucide-react';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { CreateGroupDialog } from '@/components/admin/groups/CreateGroupDialog';
import { GroupList } from '@/components/admin/groups/GroupList';
import { EditGroupDialog } from '@/components/admin/groups/EditGroupDialog';
import { ConfirmDialog } from '@/components/admin/groups/ConfirmDialog';

export const AdminGroupsPage = () => {
  const { getThemeColor } = useTheme();
  const [groups, setGroups] = useState<Group[]>(groupsData);
  const [users, setUsers] = useState<User[]>(usersData);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const handleCreateGroup = (name: string) => {
    const newGroup: Group = {
      id: Date.now().toString(),
      name: name,
    };

    setGroups(prev => [...prev, newGroup]);
    setIsDialogOpen(false);
    toast.success(`Группа ${name} успешно создана`);
  };

  const handleShareGroup = (groupName: string) => {
    const link = `${window.location.origin}/join/${groupName}`;
    navigator.clipboard.writeText(link);
    toast.success('Ссылка-приглашение скопирована в буфер обмена');
  };

  const handleEditGroup = (group: Group) => {
    setEditingGroup(group);
    setIsEditOpen(true);
  };

  const handleRequestDeleteUser = (user: User) => {
    setUserToDelete(user);
    setIsUserDeleteDialogOpen(true);
  };

  const handleConfirmDeleteUser = () => {
    if (!userToDelete) return;

    setUsers(prev => prev.filter(u => u.email !== userToDelete.email));
    
    if (editingGroup) {
        setGroups(prev => prev.map(g => {
            if (g.id === editingGroup.id) {
                return { ...g };
            }
            return g;
        }));
    }
    
    setIsUserDeleteDialogOpen(false);
    setUserToDelete(null);
    toast.success('Студент удален из группы');
  };

  const handleDeleteGroup = () => {
    if (!editingGroup) return;
    
    setGroups(prev => prev.filter(g => g.id !== editingGroup.id));
    setUsers(prev => prev.filter(u => u.groupId !== editingGroup.id));
    
    setIsDeleteDialogOpen(false);
    setIsEditOpen(false);
    setEditingGroup(null);
    toast.success('Группа успешно удалена');
  };

  const getGroupUsers = (groupId: string) => {
    return users.filter(u => u.groupId === groupId);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
            <h1>Учебные группы</h1>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="space-y-6 w-full">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Список групп</CardTitle>
              <CreateGroupDialog 
                isOpen={isDialogOpen}
                onOpenChange={setIsDialogOpen}
                onCreate={handleCreateGroup}
              />
            </CardHeader>
            <CardContent>
              <GroupList 
                groups={groups}
                getGroupUsers={getGroupUsers}
                onShare={handleShareGroup}
                onEdit={handleEditGroup}
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <EditGroupDialog 
        group={editingGroup}
        users={editingGroup ? getGroupUsers(editingGroup.id) : []}
        isOpen={isEditOpen}
        onOpenChange={setIsEditOpen}
        onRemoveUser={handleRequestDeleteUser}
        onDeleteGroup={() => setIsDeleteDialogOpen(true)}
      />
      
      <ConfirmDialog 
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Вы уверены?"
        description={`Это действие нельзя отменить. Группа "${editingGroup?.name}" будет удалена, а все студенты будут исключены из неё.`}
        onConfirm={handleDeleteGroup}
        confirmText="Удалить"
        variant="destructive"
      />

      <ConfirmDialog 
        isOpen={isUserDeleteDialogOpen}
        onOpenChange={setIsUserDeleteDialogOpen}
        title="Исключить студента?"
        description={`Вы действительно хотите исключить студента ${userToDelete?.name} из группы? Присоединиться повторно можно будет только по ссылке-приглашению.`}
        onConfirm={handleConfirmDeleteUser}
        confirmText="Исключить"
        variant="destructive"
      />
    </div>
  );
};
