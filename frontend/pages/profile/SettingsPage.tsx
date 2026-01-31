import { useTheme } from '@/components/contexts/ThemeProvider';
import { useState } from 'react';
import { Settings } from 'lucide-react';
import { SettingsAccount } from '@/components/settings/SettingsAccount';

export default function SettingsPage() {
  const { getThemeColor } = useTheme();

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
    achievementAlerts: true,
  });

  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
              <h1>Настройки</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="space-y-6">
              <SettingsAccount notifications={notifications} setNotifications={setNotifications} />
            </div>
          </div>
        </div>
    </div>
  );
}



