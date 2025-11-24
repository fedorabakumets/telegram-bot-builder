import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTelegramAuth, type TelegramUser } from '@/hooks/use-telegram-auth';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

interface BotInfo {
  first_name: string;
  username?: string;
  description?: string;
  short_description?: string;
}

interface TelegramLoginWidgetProps {
  botInfo?: BotInfo | null;
  onAuth?: (user: TelegramUser) => void;
  onLogout?: () => void;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export function TelegramLoginWidget({ botInfo, onAuth, onLogout }: TelegramLoginWidgetProps) {
  const { toast } = useToast();
  const { user, login, logout, isLoading } = useTelegramAuth();
  
  // Используем username бота из env или botInfo
  let botUsername = import.meta.env.VITE_TELEGRAM_BOT_USERNAME || botInfo?.username;
  
  // Удаляем @ в начале если есть
  if (botUsername && botUsername.startsWith('@')) {
    botUsername = botUsername.slice(1);
  }
  
  // Если нет username, не показываем виджет
  if (!botUsername) {
    return null;
  }

  const handleLogout = () => {
    logout();
    if (onLogout) {
      onLogout();
    }
    toast({
      title: "Выход",
      description: "Вы вышли из системы",
    });
  };

  useEffect(() => {
    // Определяем глобальную функцию обратного вызова
    window.onTelegramAuth = async (telegramUser: any) => {
      try {
        // Отправляем данные пользователя на бэк
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
            photo_url: telegramUser.photo_url,
            auth_date: telegramUser.auth_date,
            hash: telegramUser.hash,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const userData: TelegramUser = {
            id: data.user.id,
            firstName: data.user.firstName || telegramUser.first_name,
            lastName: data.user.lastName || telegramUser.last_name,
            username: data.user.username || telegramUser.username,
            photoUrl: data.user.photoUrl || telegramUser.photo_url,
          };
          
          // Сохраняем в локальном состоянии (БД уже сохранила)
          login(userData);
          
          toast({
            title: "Авторизация успешна",
            description: `Добро пожаловать, ${telegramUser.first_name}!`,
          });
          
          // Вызываем колбэк если нужен
          if (onAuth) {
            onAuth(userData);
          }
        } else {
          toast({
            title: "Ошибка авторизации",
            description: "Не удалось авторизоваться",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Auth error:', error);
        toast({
          title: "Ошибка",
          description: "Ошибка при авторизации",
          variant: "destructive"
        });
      }
    };

    // Загружаем скрипт виджета только один раз при монтировании компонента
    // Но только если пользователь не авторизован
    if (!user && botUsername) {
      const script = document.createElement('script');
      script.src = 'https://telegram.org/js/telegram-widget.js?22';
      script.async = true;
      script.dataset.telegramLogin = botUsername;
      script.dataset.size = 'small';
      script.dataset.onauth = 'onTelegramAuth(user)';
      script.dataset.requestAccess = 'write';

      const container = document.getElementById('telegram-login-widget');
      if (container) {
        container.appendChild(script);
      }

      return () => {
        // Очищаем контейнер при размонтировании
        if (container) {
          container.innerHTML = '';
        }
      };
    }
  }, [user, login, toast, onAuth]);

  // Пока загружаем состояние авторизации
  if (isLoading) {
    return null;
  }

  // Если пользователь авторизован, показываем его профиль
  if (user) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-muted text-xs">
          <User className="w-3 h-3" />
          <span className="truncate max-w-[120px]">{user.first_name}</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleLogout}
          className="h-7 px-2"
          title="Выход"
          data-testid="button-logout-telegram"
        >
          <LogOut className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  // Если не авторизован, показываем виджет
  return <div id="telegram-login-widget" />;
}
