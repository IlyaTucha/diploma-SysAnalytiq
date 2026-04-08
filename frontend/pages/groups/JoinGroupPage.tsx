import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { groupsApi, authApi } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';
import { useData } from '@/lib/data';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function JoinGroupPage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { updateUser, user } = useAuth();
  const { reloadSubmissions } = useData();
  const [loading, setLoading] = useState(true);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [joining, setJoining] = useState(false);
  const [groupName, setGroupName] = useState('');
  const joinCalledRef = useRef(false);

  const doJoin = async (pwd: string) => {
    if (!inviteCode) return;
    if (joinCalledRef.current) return;
    joinCalledRef.current = true;
    try {
      const group = await groupsApi.join(inviteCode, pwd);
      try {
        const freshUser = await authApi.getMe();
        if (user) {
          updateUser({
            ...user,
            groupId: freshUser.groupId || group.id,
            groupName: freshUser.groupName || group.name,
          });
        }
      } catch {
        if (user) {
          updateUser({ ...user, groupId: group.id, groupName: group.name });
        }
      }
      await reloadSubmissions();
      toast.success(`Вы успешно вступили в группу «${group.name}»`);
      navigate('/settings', { replace: true });
    } catch (err: any) {
      joinCalledRef.current = false;
      const msg = err.message || '';
      if (msg.includes('пароль') || msg.includes('403') || msg.includes('Forbidden')) {
        setNeedsPassword(true);
        setLoading(false);
        if (pwd) {
          toast.error('Неверный пароль группы');
        }
      } else {
        toast.error(msg || 'Не удалось вступить в группу');
        navigate('/', { replace: true });
      }
    } finally {
      setLoading(false);
      setJoining(false);
    }
  };

  useEffect(() => {
    if (!inviteCode) {
      toast.error('Некорректная ссылка для вступления в группу');
      navigate('/', { replace: true });
      return;
    }
    // Check invite first to avoid 403 in console
    groupsApi.checkInvite(inviteCode).then((info) => {
      setGroupName(info.groupName);
      if (info.requiresPassword) {
        setNeedsPassword(true);
        setLoading(false);
      } else {
        doJoin('');
      }
    }).catch(() => {
      toast.error('Не удалось найти группу по ссылке');
      navigate('/', { replace: true });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteCode]);

  const handleSubmitPassword = () => {
    if (!password.trim()) {
      toast.error('Введите пароль группы');
      return;
    }
    setJoining(true);
    doJoin(password);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-muted-foreground">Вступление в группу...</p>
        </div>
      </div>
    );
  }

  if (needsPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle>Вступление в группу{groupName ? ` «${groupName}»` : ''}</CardTitle>
            <CardDescription>Для вступления в группу необходимо ввести пароль</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={(e) => { e.preventDefault(); handleSubmitPassword(); }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="join-password">Пароль группы</Label>
                <Input
                  id="join-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Введите пароль"
                  autoComplete="off"
                />
              </div>
              <Button type="submit" disabled={joining || !password.trim()} className="w-full">
                {joining ? 'Вступление...' : 'Вступить в группу'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
