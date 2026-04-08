import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Shield } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { authApi } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from 'sonner';

interface SettingsAccountProps {
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReport: boolean;
    achievementAlerts: boolean;
  };
  setNotifications: (notifications: any) => void;
}

export function SettingsAccount(_props: SettingsAccountProps) {
  const { logout, user, updateUser } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);

  const notificationsEnabled = user?.telegramNotifications ?? false;

  const handleToggleNotifications = async () => {
    if (!user) return;
    setToggling(true);
    try {
      const newEnabled = !notificationsEnabled;
      const updatedUser = await authApi.toggleTelegramNotifications(newEnabled);
      updateUser({
        ...user,
        telegramNotifications: updatedUser.telegramNotifications ?? newEnabled,
      });
      toast.success(newEnabled
        ? 'Telegram уведомления включены'
        : 'Telegram уведомления отключены'
      );
    } catch {
      toast.error('Не удалось изменить настройку уведомлений');
    } finally {
      setToggling(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await authApi.deleteAccount();
      toast.success('Аккаунт удалён');
      logout();
    } catch {
      toast.error('Ошибка удаления аккаунта');
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <>
      <Card className="p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-4">
          <Bell className="w-5 h-5" style={{ color: '#4F46E5' }} />
          <h2>Уведомления</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="mb-1">Telegram уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Получать уведомления о проверке заданий в Telegram боте
              </p>
            </div>
            <Switch
              checked={notificationsEnabled}
              onCheckedChange={handleToggleNotifications}
              disabled={toggling}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-xl border-destructive/50">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-destructive" />
          <h2>Управление аккаунтом</h2>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h4 className="mb-1 text-destructive">Удалить аккаунт</h4>
            <p className="text-sm text-muted-foreground">
              Безвозвратное удаление вашего аккаунта и всех данных
            </p>
          </div>
          <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
            Удалить аккаунт
          </Button>
        </div>
      </Card>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Удаление аккаунта</DialogTitle>
            <DialogDescription>
              Это действие необратимо. Будут удалены ваш аккаунт, прогресс, уведомления, решения и все отправленные работы.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
              Отмена
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleting}>
              {deleting ? 'Удаление...' : 'Удалить навсегда'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
