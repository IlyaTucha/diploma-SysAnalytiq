import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Shield } from 'lucide-react';
import { toast } from "sonner";

interface SettingsAccountProps {
  notifications: {
    emailNotifications: boolean;
    pushNotifications: boolean;
    weeklyReport: boolean;
    achievementAlerts: boolean;
  };
  setNotifications: (notifications: any) => void;
}

export function SettingsAccount({ notifications, setNotifications }: SettingsAccountProps) {
  const handleToggle = (key: string, value: boolean) => {
    setNotifications({ ...notifications, [key]: value });
    toast.success('Настройки сохранены');
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 rounded-xl">
        <div className="flex items-center gap-3">
          <Bell className="w-5 h-5" style={{ color: '#4F46E5' }} />
          <h2>Уведомления</h2>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-border">
            <div>
              <h4 className="mb-1">Email уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Получать уведомления на email
              </p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) => handleToggle('emailNotifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <h4 className="mb-1">Push-уведомления</h4>
              <p className="text-sm text-muted-foreground">
                Получать push-уведомления в браузере
              </p>
            </div>
            <Switch
              checked={notifications.pushNotifications}
              onCheckedChange={(checked) => handleToggle('pushNotifications', checked)}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-xl border-destructive/50">
        <div className="flex items-center gap-3">
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
          <Button variant="destructive">Удалить аккаунт</Button>
        </div>
      </Card>
    </div>
  );
}
