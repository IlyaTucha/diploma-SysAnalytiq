import { useTheme } from '@/components/contexts/ThemeProvider';
import { useAuth } from '@/components/contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { Settings, Users, UserIcon, Save, Bell, Shield, LinkIcon, Unlink } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { TelegramLink } from '@/components/ui/ProfileLinks';
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

declare global {
  interface Window {
    onTelegramBind?: (user: any) => void;
  }
}

export default function SettingsPage() {
  const { getThemeColor } = useTheme();
  const { user, updateUser, logout } = useAuth();

  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [saving, setSaving] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [binding, setBinding] = useState(false);
  const telegramWidgetRef = useRef<HTMLDivElement>(null);

  const notificationsEnabled = user?.telegramNotifications ?? false;
  const telegramBound = !!user?.telegramUsername;

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

  const handleUnbindTelegram = async () => {
    if (!user) return;
    setBinding(true);
    try {
      const updated = await authApi.unbindTelegram();
      updateUser({
        ...user,
        telegramUsername: updated.telegramUsername || '',
        telegramNotifications: updated.telegramNotifications ?? false,
      });
      toast.success('Telegram аккаунт отвязан');
    } catch {
      toast.error('Ошибка отвязки Telegram');
    } finally {
      setBinding(false);
    }
  };

  useEffect(() => {
    if (telegramBound) return;

    window.onTelegramBind = async (tgUser: any) => {
      if (!user) return;
      setBinding(true);
      try {
        const updated = await authApi.bindTelegram({
          id: tgUser.id,
          first_name: tgUser.first_name || '',
          last_name: tgUser.last_name || '',
          username: tgUser.username || '',
          photo_url: tgUser.photo_url || '',
          auth_date: tgUser.auth_date,
          hash: tgUser.hash,
        });
        updateUser({
          ...user,
          telegramUsername: updated.telegramUsername || tgUser.username || '',
          telegramNotifications: updated.telegramNotifications ?? false,
        });
        toast.success('Telegram аккаунт привязан!');
      } catch (err: any) {
        const message = err?.detail || err?.message || 'Ошибка привязки Telegram';
        toast.error(message);
      } finally {
        setBinding(false);
      }
    };

    return () => { delete window.onTelegramBind; };
  }, [telegramBound, user, updateUser]);

  useEffect(() => {
    if (telegramBound || !telegramWidgetRef.current) return;

    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'SysAnalytiqBot';
    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'medium');
    script.setAttribute('data-onauth', 'onTelegramBind(user)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-radius', '8');

    telegramWidgetRef.current.innerHTML = '';
    telegramWidgetRef.current.appendChild(script);
  }, [telegramBound]);

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

              {/* Привязка Telegram */}
              <Card className="p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-4">
                  <LinkIcon className="w-5 h-5" style={{ color: '#4F46E5' }} />
                  <h2>Привязка Telegram</h2>
                </div>

                <div className="space-y-4">
                  {telegramBound ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Привязанный аккаунт:</p>
                        <TelegramLink username={user?.telegramUsername || ''} className="text-base" />
                      </div>
                      <Button variant="outline" size="sm" onClick={handleUnbindTelegram} disabled={binding}>
                        <Unlink className="w-4 h-4 mr-2" />
                        {binding ? 'Отвязка...' : 'Отвязать'}
                      </Button>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Привяжите Telegram аккаунт для получения уведомлений о проверке заданий
                      </p>
                      <div ref={telegramWidgetRef} />
                    </div>
                  )}
                </div>
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
                      disabled={toggling || !telegramBound}
                    />
                  </div>
                  {!telegramBound && (
                    <p className="text-xs text-muted-foreground">
                      Для включения уведомлений необходимо привязать Telegram аккаунт
                    </p>
                  )}
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
