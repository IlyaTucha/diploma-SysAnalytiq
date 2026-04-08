import { useTheme } from '@/components/contexts/ThemeProvider';
import { useAuth } from '@/components/contexts/AuthContext';
import { useState } from 'react';
import { Settings, Users, UserIcon, Save, Bell, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TelegramLink } from '@/components/ui/TelegramLink';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from '@/components/ui/dialog';
import { authApi } from '@/lib/api';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { getThemeColor } = useTheme();
  const { user, updateUser, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
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

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const updated = await authApi.updateProfile({ firstName, lastName });
      if (user) {
        updateUser({
          ...user,
          firstName: updated.firstName || firstName,
          lastName: updated.lastName || lastName,
          name: updated.name || `${firstName} ${lastName}`.trim(),
        });
      }
      toast.success('Профиль обновлён');
    } catch {
      toast.error('Ошибка при сохранении профиля');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
            <h1>Настройки</h1>
          </div>
      </div>

        <div className="flex-1 p-4 md:p-8">
            <div className="space-y-6">

              {/* Профиль */}
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <UserIcon className="w-5 h-5" style={{ color: '#4F46E5' }} />
                  <h2>Профиль</h2>
                </div>

                <div className="space-y-4">
                  {/* Telegram username — только для чтения */}
                  <div>
                    <Label className="text-sm text-muted-foreground">Telegram</Label>
                    <div className="mt-1">
                      {user?.telegramUsername ? (
                        <TelegramLink username={user.telegramUsername} className="text-base" />
                      ) : (
                        <span className="text-muted-foreground">Не указан</span>
                      )}
                    </div>
                  </div>

                  {/* Имя и Фамилия в две колонки */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Имя */}
                    <div>
                      <Label htmlFor="firstName">Имя</Label>
                      <Input
                        id="firstName"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Введите имя"
                        className="mt-1"
                      />
                    </div>

                    {/* Фамилия */}
                    <div>
                      <Label htmlFor="lastName">Фамилия</Label>
                      <Input
                        id="lastName"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Введите фамилию"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={saving || (firstName === (user?.firstName || '') && lastName === (user?.lastName || ''))}>
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Сохранение...' : 'Сохранить'}
                  </Button>
                </div>
              </Card>

              {/* Информация о группе */}
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <Users className="w-5 h-5" style={{ color: '#4F46E5' }} />
                  <h2>Группа</h2>
                </div>
                {user?.isAdmin ? (
                  <p className="text-muted-foreground text-sm pt-2">
                    Вы являетесь преподавателем. Вступление в группу не требуется.
                  </p>
                ) : user?.groupId ? (
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary" className="text-sm px-3 py-1">
                      Группа: {user.groupName || user.groupId}
                    </Badge>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm pt-2">
                    Вы не состоите ни в одной группе. Попросите преподавателя отправить вам ссылку-приглашение.
                  </p>
                )}
              </Card>

              {/* Уведомления */}
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

              {/* Управление аккаунтом */}
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
                  <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>Удалить аккаунт</Button>
                </div>
              </Card>
            </div>

            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Удаление аккаунта</DialogTitle>
                  <DialogDescription>
                    Это действие необратимо. Будут удалены ваш прогресс, уведомления и решения. Отправленные работы сохранятся для преподавателя.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={deleting}>
                    Отмена
                  </Button>
                  <Button
                    variant="destructive"
                    disabled={deleting}
                    onClick={async () => {
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
                    }}
                  >
                    {deleting ? 'Удаление...' : 'Удалить навсегда'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
        </div>
    </div>
  );
}



