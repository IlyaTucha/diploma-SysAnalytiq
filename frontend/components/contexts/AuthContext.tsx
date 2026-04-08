import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types/user';
import { authApi, setTokens, clearTokens, getAccessToken } from '@/lib/api';

interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  login: (telegramData: any) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapUserData(u: any): User {
  return {
    id: u.id,
    name: u.name,
    firstName: u.firstName || '',
    lastName: u.lastName || '',
    telegramUsername: u.telegramUsername || '',
    telegramNotifications: u.telegramNotifications ?? false,
    avatar: u.avatar || undefined,
    isAdmin: u.isAdmin,
    groupId: u.groupId || undefined,
    groupName: u.groupName || undefined,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const isAuthenticated = !!user;
  const isAdmin = !!user?.isAdmin;

  const login = async (telegramData: any) => {
    const res = await authApi.telegramLogin(telegramData);
    setTokens(res.access, res.refresh);

    const userData = mapUserData(res.user);
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    clearTokens();
    localStorage.removeItem('user');
    localStorage.removeItem('completedLessons');
    // Полная перезагрузка — сбросит все React-контексты (DataProvider, NotificationProvider, ProgressProvider)
    window.location.href = '/login';
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  useEffect(() => {
    if (user && getAccessToken()) {
      authApi.getMe()
        .then((u: any) => {
          const updated = mapUserData(u);
          setUser(updated);
          localStorage.setItem('user', JSON.stringify(updated));
        })
        .catch(() => {
          logout();
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, isAdmin, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
