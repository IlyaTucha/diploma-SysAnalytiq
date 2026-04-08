import { useState } from 'react';
import { Bell } from 'lucide-react';
import { useAuth } from '@/components/contexts/AuthContext';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { useNotifications } from '@/components/contexts/NotificationContext';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { Navigate } from 'react-router-dom';

export default function NotificationsPage() {
  const { isAdmin } = useAuth();
  const { getThemeColor } = useTheme();
  const { notifications, markAsRead } = useNotifications();
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());

  if (isAdmin) {
      return <Navigate to="/admin/reviews" replace />;
  }
  
  const handleMarkRead = (id: string, type: string) => {
    markAsRead(id);
    if (type === 'approved') {
      setPinnedIds(prev => new Set(prev).add(id));
    }
  };

  const handleCollapse = (id: string) => {
    setPinnedIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const sortedNotifications = [...notifications].sort((a, b) => {
    const aEffectivelyUnread = !a.isRead || pinnedIds.has(a.id);
    const bEffectivelyUnread = !b.isRead || pinnedIds.has(b.id);
    if (aEffectivelyUnread === bEffectivelyUnread) {
       return new Date(b.reviewDate).getTime() - new Date(a.reviewDate).getTime();
    }
    return aEffectivelyUnread ? -1 : 1;
  });
  
  return (
    <div className="flex-1 flex flex-col">
      <div className="bg-card border-b border-border p-6">
            <div className="flex items-center gap-3">
              <Bell className="w-8 h-8" style={{ color: getThemeColor('#4F46E5') }} />
              <h1>Уведомления</h1>
            </div>
        </div>

        <div className="flex-1 p-4 md:p-8">
          <div className="space-y-4">
              {sortedNotifications.length > 0 ? (
                sortedNotifications.map((notification) => (
                  <NotificationItem 
                    key={notification.id} 
                    notification={notification} 
                    onRead={() => handleMarkRead(notification.id, notification.type)}
                    isPinned={pinnedIds.has(notification.id)}
                    onCollapse={() => handleCollapse(notification.id)}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  У вас пока нет уведомлений
                </div>
              )}
        </div>
      </div>
    </div>
  );
}



