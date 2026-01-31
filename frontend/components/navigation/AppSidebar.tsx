import { Link, useLocation } from 'react-router-dom';
import { BookOpen, Code, Settings, LogOut, Menu, X, Moon, Sun, Shield, Bell, Users } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { useAuth } from '@/components/contexts/AuthContext';
import { useTheme } from '@/components/contexts/ThemeProvider';
import { useNotifications } from '@/components/contexts/NotificationContext';
import { reviewsData } from '@/mocks/ReviewsMock';

export function AppSidebar() {
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { logout, isAdmin, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { unreadCount } = useNotifications();

  const notificationBadgeCount = isAdmin ? 0 : unreadCount;
  
  const pendingReviewsCount = reviewsData.filter(r => r.status === 'pending').length;

  const baseNavItems = [
    { icon: <BookOpen className="w-5 h-5" />, label: 'Модули', path: '/modules' },
    { icon: <Code className="w-5 h-5" />, label: 'Песочница', path: '/playground' },
    ...(isAdmin ? [] : [
      { icon: <Bell className="w-5 h-5" />, label: 'Уведомления', path: '/notifications', badge: notificationBadgeCount }
    ]),
  ];
  
  const navItems = baseNavItems;

  const adminNavItems = [
    {
      icon: <Bell className="w-5 h-5" />,
      label: 'Проверка заданий',
      path: '/admin/reviews',
      badge: pendingReviewsCount, 
    },
    {
      icon: <Shield className="w-5 h-5" />,
      label: 'Управление модулями',
      path: '/admin/modules',
    },
    {
      icon: <Users className="w-5 h-5" />,
      label: 'Учебные группы',
      path: '/admin/groups',
    },
  ];

  const sidebarContent = (
    <>
      <Link to="/" className="flex items-center gap-2 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-[#4F46E5] flex items-center justify-center">
          <span className="text-white">S</span>
        </div>
        <span className="text-xl">SysAnalytiq</span>
      </Link>

      <Link to="/settings" className="block p-4 border-b border-border hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <Avatar>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <AvatarFallback style={{ backgroundColor: '#4F46E5', color: 'white' }}>
                {user?.name?.charAt(0) || 'U'}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            <div>{user?.name || 'Пользователь'}</div>
            <div className="text-sm text-muted-foreground">
              {isAdmin ? 'Администратор' : 'Студент'}
            </div>
          </div>
          <Settings className="w-5 h-5 text-muted-foreground" />
        </div>
      </Link>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                  location.pathname === item.path
                    ? 'text-white'
                    : 'text-foreground hover:bg-accent'
                }`}
                style={
                  location.pathname === item.path
                    ? { backgroundColor: '#4F46E5' }
                    : {}
                }
                onClick={() => setIsMenuOpen(false)}
              >
                {item.icon}
                <span className="flex-1">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <Badge 
                    className="bg-destructive text-destructive-foreground min-w-[20px] h-5 flex items-center justify-center px-1.5"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Link>
            </li>
          ))}
          
          {isAdmin && (
            <>
              <li className="pt-4 mt-4 border-t border-border">
                <div className="px-4 mb-2 text-xs text-muted-foreground uppercase tracking-wider">
                  Админ-панель
                </div>
              </li>
              {adminNavItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors relative ${
                      location.pathname === item.path
                        ? 'text-white'
                        : 'text-foreground hover:bg-accent'
                    }`}
                    style={
                      location.pathname === item.path
                        ? { backgroundColor: '#F59E0B' }
                        : {}
                    }
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.icon}
                    <span className="flex-1">{item.label}</span>
                    {item.badge && item.badge > 0 && (
                      <Badge 
                        className="bg-warning text-warning-foreground min-w-[20px] h-5 flex items-center justify-center px-1.5"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                </li>
              ))}
            </>
          )}
        </ul>
      </nav>

      <div className="p-4 border-t border-border space-y-2">
        <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-muted/50">
          <div className="flex items-center gap-3">
            {theme === 'dark' ? (
              <Moon className="w-5 h-5 text-foreground" />
            ) : (
              <Sun className="w-5 h-5 text-foreground" />
            )}
            <Label htmlFor="theme-switch" className="cursor-pointer">
              {theme === 'dark' ? 'Темная тема' : 'Светлая тема'}
            </Label>
          </div>
          <Switch
            id="theme-switch"
            checked={theme === 'dark'}
            onCheckedChange={toggleTheme}
          />
        </div>
        <button
          onClick={() => {
            logout();
            setIsMenuOpen(false);
          }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-5 h-5" />
          <span>Выход</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-lg border border-border"
        onClick={() => setIsMenuOpen(!isMenuOpen)}
      >
        {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {isMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            className="w-72 h-full bg-card flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className="hidden md:flex w-72 h-screen sticky top-0 bg-card border-r border-border flex-col shrink-0">
        {sidebarContent}
      </aside>
    </>
  );
}