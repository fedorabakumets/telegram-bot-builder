import React, { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TelegramLoginWidgetProps {
  botUsername: string;
  onAuth?: (user: any) => void;
}

declare global {
  interface Window {
    onTelegramAuth: (user: any) => void;
  }
}

export function TelegramLoginWidget({ botUsername, onAuth }: TelegramLoginWidgetProps) {
  const { toast } = useToast();

  useEffect(() => {
    // Определяем глобальную функцию обратного вызова
    window.onTelegramAuth = async (user: any) => {
      try {
        // Отправляем данные пользователя на бэк
        const response = await fetch('/api/auth/telegram', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: user.id,
            first_name: user.first_name,
            last_name: user.last_name,
            username: user.username,
            photo_url: user.photo_url,
            auth_date: user.auth_date,
            hash: user.hash,
          }),
        });

        if (response.ok) {
          toast({
            title: "Авторизация успешна",
            description: `Добро пожаловать, ${user.first_name}!`,
          });
          
          // Перезагружаем страницу или вызываем колбэк
          if (onAuth) {
            onAuth(user);
          } else {
            window.location.reload();
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

    // Загружаем скрипт виджета
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
  }, [botUsername, toast, onAuth]);

  return <div id="telegram-login-widget" />;
}
