import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/components/contexts/AuthContext';
import { toast } from "sonner";
import { useTheme } from '@/components/contexts/ThemeProvider';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { getThemeColor } = useTheme();

  const handleLogin = (provider: string) => {
    // Simulate OAuth login
    // For demo: Google login = admin, VK login = regular user
    const isAdmin = provider === 'Google';
    const email = provider === 'Google' ? 'admin@gmail.com' : 'user@gmail.com';
    
    toast.success(`Успешный вход через ${provider}!`);
    login(email, isAdmin);
    
    if (isAdmin) {
      toast.success('Добро пожаловать, администратор!');
    }
    
    navigate('/dashboard');
  };

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

        <h2 className="text-center mb-2">Войдите, чтобы продолжить</h2>
        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-16 flex items-center justify-center gap-3 bg-background hover:bg-accent"
            onClick={() => handleLogin('Google')}
          >
            <svg className="w-8 h-8" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>Войти через Google</span>
          </Button>

          <Button
            className="w-full h-16 flex items-center justify-center gap-3 text-white"
            style={{ backgroundColor: getThemeColor('#0077FF', '#3B82F6') }}
            onClick={() => handleLogin('VK')}
          >
            <svg className="w-8 h-8" viewBox="0 0 48 48" fill="currentColor">
              <path d="M25.2,38.2c-11.2,0-17.6-7.7-17.9-20.5h5.6c0.2,9.4,4.3,13.4,7.6,14.2V17.7h5.3v8.3c3.2-0.3,6.6-4,7.7-8.3h5.3c-0.9,5-4.6,8.7-7.2,10.2c2.6,1.3,6.8,4.5,8.4,10.4h-5.8c-1.2-3.8-4.2-6.7-8.2-7.1v7.1H25.2z"/>
            </svg>
            <span>Войти через VK</span>
          </Button>
        </div>
      </Card>
    </div>
  );
}



