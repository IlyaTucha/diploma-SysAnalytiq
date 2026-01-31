import { Share2, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Group } from '@/types/group';
import { User } from '@/types/user';

interface GroupListProps {
  groups: Group[];
  getGroupUsers: (groupId: string) => User[];
  onShare: (groupName: string) => void;
  onEdit: (group: Group) => void;
}

export function GroupList({ groups, getGroupUsers, onShare, onEdit }: GroupListProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Название</TableHead>
          <TableHead>Количество студентов</TableHead>
          <TableHead className="text-right">Действия</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {groups.map((group) => (
          <TableRow key={group.id}>
            <TableCell className="font-medium">{group.name}</TableCell>
            <TableCell>{getGroupUsers(group.id).length}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onShare(group.name)}
                  title="Скопировать ссылку приглашения"
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  Пригласить
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(group)}
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
