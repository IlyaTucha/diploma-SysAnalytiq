import React, { createContext, useContext, useState, useEffect } from 'react';
import { Notification } from '@/types/notification';
import { notificationsApi, getAccessToken } from '@/lib/api';
import { useAuth } from '@/components/contexts/AuthContext';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  refreshNotifications: () => void;
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

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const loadNotifications = () => {
    if (!getAccessToken()) return;
    notificationsApi.list()
      .then(data => setNotifications(data.map(mapApiNotification)))
      .catch(() => {});
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadNotifications();
    const interval = setInterval(() => {
      if (getAccessToken()) {
        loadNotifications();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, refreshNotifications: loadNotifications }}>
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
