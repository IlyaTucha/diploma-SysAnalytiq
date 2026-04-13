import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from "sonner";

declare global {
  interface Window {
    VKIDSDK?: any;
  }
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const vkContainerRef = useRef<HTMLDivElement>(null);
  const sdkInitialized = useRef(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (sdkInitialized.current || isAuthenticated) return;

    const appId = import.meta.env.VITE_VK_APP_ID;
    if (!appId) {
      toast.error('VITE_VK_APP_ID не настроен');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@<3.0.0/dist-sdk/umd/index.js';
    script.async = true;
    script.onload = () => {
      const VKID = window.VKIDSDK;
      if (!VKID || !vkContainerRef.current) return;

      sdkInitialized.current = true;

      VKID.Config.init({
        app: Number(appId),
        redirectUrl: `${window.location.origin}/login`,
        responseMode: VKID.ConfigResponseMode.Callback,
        source: VKID.ConfigSource.LOWCODE,
        scope: '',
      });

      const oneTap = new VKID.OneTap();

      oneTap.render({
        container: vkContainerRef.current,
        showAlternativeLogin: true,
      })
        .on(VKID.WidgetEvents.ERROR, (error: any) => {
          console.error('VK ID error:', error);
          toast.error('Ошибка VK ID');
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, async (payload: any) => {
          const code = payload.code;
          const deviceId = payload.device_id;

          setLoading(true);
          try {
            const tokenData = await VKID.Auth.exchangeCode(code, deviceId);
            await login({
              access_token: tokenData.access_token,
            });
            toast.success('Успешный вход!');
            navigate('/', { replace: true });
          } catch (err) {
            console.error('VK auth error:', err);
            toast.error('Ошибка входа через VK');
          } finally {
            setLoading(false);
          }
        });
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [isAuthenticated, login, navigate]);

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

        <div className="flex justify-center w-full">
          {loading ? (
            <p className="text-muted-foreground">Вход...</p>
          ) : (
            <div ref={vkContainerRef} className="w-full" />
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Авторизация через VK аккаунт
        </p>
      </Card>
    </div>
  );
}
