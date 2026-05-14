import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Notification } from '@/types/notification';
import { notificationsApi, adminApi, getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';

const PUSH_ENABLED_KEY = 'pushNotificationsEnabled';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  pendingReviewsCount: number;
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
    try { localStorage.setItem(PUSH_ENABLED_KEY, String(enabled)); } catch { /* localStorage недоступен */ }
  }, [pushSupported]);

  // ID, для которых уже отправили браузерное уведомление в этой сессии — защита от дублей при гонке параллельных запросов
  const notifiedNotifIdsRef = useRef<Set<string>>(new Set());
  const loadNotifications = useCallback(() => {
    if (!getAccessToken() || isAdmin) return;
    notificationsApi.list()
      .then(data => {
        const mapped = data.map(mapApiNotification);
        const ids = new Set(mapped.map(n => n.id));
        // Отправляем браузерное уведомление для новых непрочитанных
        if (pushEnabled && prevIdsRef.current.size > 0) {
          for (const n of mapped) {
            if (!n.isRead && n.type !== 'pending' && !prevIdsRef.current.has(n.id) && !notifiedNotifIdsRef.current.has(n.id)) {
              notifiedNotifIdsRef.current.add(n.id);
              const typeLabel = n.type === 'approved' ? 'Работа принята' : n.type === 'rejected' ? 'Работа отклонена' : 'Уведомление';
              sendBrowserNotification(typeLabel, n.lessonTitle || n.generalComment || '');
            }
          }
        }
        // Чистим память: убираем id, которых больше нет в выдаче сервера
        for (const id of Array.from(notifiedNotifIdsRef.current)) {
          if (!ids.has(id)) notifiedNotifIdsRef.current.delete(id);
        }
        prevIdsRef.current = ids;
        setNotifications(mapped);
      })
      .catch(() => {});
  }, [isAdmin, pushEnabled]);

  // Для преподавателя — следим за новыми работами на проверку
  const [pendingReviewsCount, setPendingReviewsCount] = useState(0);
  const adminPendingIdsRef = useRef<Set<string>>(new Set());
  const notifiedAdminIdsRef = useRef<Set<string>>(new Set());
  const loadAdminPending = useCallback(() => {
    if (!getAccessToken() || !isAdmin) return;
    adminApi.submissions('pending')
      .then((data: any[]) => {
        const items = data || [];
        const ids = new Set(items.map((s: any) => String(s.id)));
        const prev = adminPendingIdsRef.current;
        if (pushEnabled && prev.size > 0) {
          const fresh = items.filter((s: any) => {
            const id = String(s.id);
            return !prev.has(id) && !notifiedAdminIdsRef.current.has(id);
          });
          // Сразу помечаем, что уведомление по этим id отправлено — даже если параллельный запрос увидит то же fresh
          for (const s of fresh) notifiedAdminIdsRef.current.add(String(s.id));
          if (fresh.length === 1) {
            const s = fresh[0];
            const studentName = s.studentName || 'Студент';
            sendBrowserNotification('Новая работа на проверку', studentName);
          } else if (fresh.length > 1) {
            sendBrowserNotification(
              'Новые работы на проверку',
              `${fresh.length} новых заданий ожидают проверки`,
            );
          }
        }
        // Чистим память: убираем id, которых больше нет в pending (работа проверена/удалена)
        for (const id of Array.from(notifiedAdminIdsRef.current)) {
          if (!ids.has(id)) notifiedAdminIdsRef.current.delete(id);
        }
        adminPendingIdsRef.current = ids;
        setPendingReviewsCount(items.length);
      })
      .catch(() => {});
  }, [isAdmin, pushEnabled]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const tick = isAdmin ? loadAdminPending : loadNotifications;
    tick();

    const interval = setInterval(() => {
      if (getAccessToken()) tick();
    }, 30000);

    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && getAccessToken()) {
        tick();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Возврат фокуса в окно — на случай, если setInterval затроттлен браузером
    const handleFocus = () => {
      if (getAccessToken()) tick();
    };
    window.addEventListener('focus', handleFocus);

    // Мгновенное обновление после действий на стороне фронта (например, преподаватель завершил проверку)
    const handleReviewsUpdated = () => tick();
    window.addEventListener('reviews-updated', handleReviewsUpdated);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('reviews-updated', handleReviewsUpdated);
    };
  }, [isAuthenticated, isAdmin, loadNotifications, loadAdminPending]);

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
    <NotificationContext.Provider value={{ notifications, unreadCount, pendingReviewsCount, markAsRead, markAllAsRead, refreshNotifications: loadNotifications, pushEnabled, setPushEnabled, pushSupported, pushDenied }}>
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
