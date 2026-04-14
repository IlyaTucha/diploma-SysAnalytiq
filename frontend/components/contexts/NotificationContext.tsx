import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Notification } from '@/types/notification';
import { notificationsApi, getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';

const PUSH_ENABLED_KEY = 'pushNotificationsEnabled';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
  pushEnabled: boolean;
  setPushEnabled: (enabled: boolean) => void;
  pushSupported: boolean;
  pushDenied: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

function mapApiNotification(n: any): Notification {
  return {
    id: n.id,
    type: n.type,
    reviewer: n.reviewer || { id: '', name: '', email: '', isAdmin: true },
    moduleName: n.moduleName || '',
    lessonTitle: n.lessonTitle || '',
    reviewDate: n.createdAt || new Date().toISOString(),
    generalComment: n.message || '',
    highlightedCode: n.highlightedCode || undefined,
    inlineComment: n.inlineComment || undefined,
    startLine: n.startLine || undefined,
    endLine: n.endLine || undefined,
    inlineComments: n.inlineComments || undefined,
    lessonPath: n.lessonPath || '',
    isRead: n.isRead,
  };
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (window.Notification.permission !== 'granted') return;
  if (document.visibilityState === 'visible') return;
  try {
    new window.Notification(title, { body, icon: '/favicon.ico' });
  } catch { /* игнорируем ошибки */ }
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevIdsRef = useRef<Set<string>>(new Set());
  const pushSupported = typeof window !== 'undefined' && 'Notification' in window;
  const [pushEnabled, setPushEnabledState] = useState(() => {
    try { return localStorage.getItem(PUSH_ENABLED_KEY) === 'true'; } catch { return false; }
  });
  const [pushDenied, setPushDenied] = useState(() => {
    return pushSupported && window.Notification.permission === 'denied';
  });

  const setPushEnabled = useCallback(async (enabled: boolean) => {
    if (enabled && pushSupported) {
      if (window.Notification.permission === 'denied') {
        setPushDenied(true);
        return;
      }
      const permission = await window.Notification.requestPermission();
      setPushDenied(permission === 'denied');
      if (permission !== 'granted') return;
    }
    setPushEnabledState(enabled);
    try { localStorage.setItem(PUSH_ENABLED_KEY, String(enabled)); } catch {}
  }, [pushSupported]);

  const loadNotifications = useCallback(() => {
    if (!getAccessToken() || isAdmin) return;
    notificationsApi.list()
      .then(data => {
        const mapped = data.map(mapApiNotification);
        // Отправляем браузерное уведомление для новых непрочитанных
        if (pushEnabled && prevIdsRef.current.size > 0) {
          for (const n of mapped) {
            if (!n.isRead && n.type !== 'pending' && !prevIdsRef.current.has(n.id)) {
              const typeLabel = n.type === 'approved' ? 'Работа принята' : n.type === 'rejected' ? 'Работа отклонена' : 'Уведомление';
              sendBrowserNotification(typeLabel, n.lessonTitle || n.generalComment || '');
            }
          }
        }
        prevIdsRef.current = new Set(mapped.map(n => n.id));
        setNotifications(mapped);
      })
      .catch(() => {});
  }, [isAdmin, pushEnabled]);

  useEffect(() => {
    if (!isAuthenticated || isAdmin) return;
    loadNotifications();

    // Поллинг каждые 60 секунд
    const interval = setInterval(() => {
      if (getAccessToken()) loadNotifications();
    }, 60000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && getAccessToken()) {
        loadNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [isAuthenticated, isAdmin, loadNotifications]);

  // Не считаем "На повторной проверке" (pending) в счётчике
  const unreadCount = notifications.filter(n => !n.isRead && n.type !== 'pending').length;

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, isRead: true } : n
    ));
    notificationsApi.markRead(id).catch(() => {});
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n =>
      (n.type !== 'rejected' && n.type !== 'pending') ? { ...n, isRead: true } : n
    ));
    notificationsApi.markAllRead().catch(() => {});
  };

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications: loadNotifications, pushEnabled, setPushEnabled, pushSupported, pushDenied }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
