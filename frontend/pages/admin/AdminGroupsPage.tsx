import { useState, useEffect } from 'react';
import { toast } from "sonner";
import { Group } from '@/types/group';
import { User } from '@/types/user';
import { groupsApi } from '@/lib/api';
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
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUserDeleteDialogOpen, setIsUserDeleteDialogOpen] = useState(false);

  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    groupsApi.list()
      .then(data => {
        setGroups(data as unknown as Group[]);
        const allMembers: User[] = [];
        Promise.all(
          (data as any[]).map(g =>
            groupsApi.members(g.id).then(members => {
              allMembers.push(...(members as unknown as User[]));
            }).catch(() => {})
          )
        ).then(() => setUsers(allMembers));
      })
      .catch(() => {});
  }, []);

  const handleCreateGroup = (name: string, password: string) => {
    groupsApi.create(name, password)
      .then(newGroup => {
        setGroups(prev => [...prev, newGroup as unknown as Group]);
        setIsDialogOpen(false);
        toast.success(`Группа ${name} успешно создана`);
      })
      .catch((err) => toast.error(err?.message || 'Ошибка создания группы'));
  };

  const handleShareGroup = (groupName: string) => {
    const group = groups.find(g => g.name === groupName);
    const code = group?.inviteCode || groupName;
    const link = `${window.location.origin}/join/${code}`;
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

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete || !editingGroup) return;

    try {
      await groupsApi.kick(editingGroup.id, userToDelete.id);
      setUsers(prev => prev.filter(u => u.id !== userToDelete.id));
      setIsUserDeleteDialogOpen(false);
      setUserToDelete(null);
      toast.success('Студент удален из группы');
    } catch {
      toast.error('Ошибка при исключении студента');
    }
  };

  const handleDeleteGroup = async () => {
    if (!editingGroup) return;
    
    try {
      await groupsApi.delete(editingGroup.id);
      setGroups(prev => prev.filter(g => g.id !== editingGroup.id));
      setUsers(prev => prev.filter(u => u.groupId !== editingGroup.id));
      setIsDeleteDialogOpen(false);
      setIsEditOpen(false);
      setEditingGroup(null);
      toast.success('Группа успешно удалена');
    } catch {
      toast.error('Ошибка при удалении группы');
    }
  };

  const getGroupUsers = (groupId: string) => {
    return users.filter(u => u.groupId === groupId);
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
            <h1>Учебные группы</h1>
          </div>
      </div>

      <div className="flex-1 p-4 md:p-8">
        <div className="space-y-4 w-full">

          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
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
        onGroupUpdated={(updated) => {
          setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
          setEditingGroup(updated);
        }}
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
