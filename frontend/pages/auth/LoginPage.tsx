import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from "sonner";

declare global {
  interface Window {
    onTelegramAuth?: (user: any) => void;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const telegramRef = useRef<HTMLDivElement>(null);
  const [widgetError, setWidgetError] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    window.onTelegramAuth = async (tgUser: any) => {
      try {
        await login({
          id: tgUser.id,
          first_name: tgUser.first_name || '',
          last_name: tgUser.last_name || '',
          username: tgUser.username || '',
          photo_url: tgUser.photo_url || '',
          auth_date: tgUser.auth_date,
          hash: tgUser.hash,
        });
        toast.success('Успешный вход!');
        navigate('/');
      } catch {
        toast.error('Ошибка входа через Telegram');
      }
    };

    return () => {
      delete window.onTelegramAuth;
    };
  }, [login, navigate]);

  useEffect(() => {
    if (!telegramRef.current) return;

    const botName = import.meta.env.VITE_TELEGRAM_BOT_NAME || 'SysAnalytiqBot';

    const script = document.createElement('script');
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');
    script.setAttribute('data-radius', '8');
    script.onerror = () => setWidgetError(true);

    telegramRef.current.innerHTML = '';
    telegramRef.current.appendChild(script);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)' }}>
      <Card className="w-full max-w-md p-8 rounded-xl">
        <Link to="/" className="flex justify-center mb-8">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-[#4F46E5] flex items-center justify-center">
              <span className="text-white">S</span>
            </div>
            <span className="text-2xl">SysAnalytiq</span>
          </div>
        </Link>

        <h2 className="text-center text-xl font-semibold mb-6">Войдите, чтобы продолжить</h2>

        <div className="flex justify-center w-full" ref={telegramRef}>
        </div>

        {widgetError && (
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
            <p className="text-sm text-destructive font-medium mb-1">
              Не удалось загрузить виджет Telegram
            </p>
            <p className="text-xs text-muted-foreground">
              Проверьте подключение к интернету или отключите прокси/VPN
            </p>
          </div>
        )}

        <p className="text-center text-sm text-muted-foreground mt-6">
          Авторизация через Telegram аккаунт
        </p>
      </Card>
    </div>
  );
}



