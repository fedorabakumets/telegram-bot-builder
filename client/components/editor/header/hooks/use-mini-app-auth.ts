/**
 * @fileoverview Хук автоматической авторизации через Telegram Mini App
 * @module components/editor/header/hooks/use-mini-app-auth
 */

import { useEffect } from 'react';
import { useTelegramAuth } from './use-telegram-auth';

/**
 * Хук автоматической авторизации через Telegram Mini App.
 * Если сайт открыт внутри Telegram — автоматически логинит пользователя.
 * Верифицирует initData на сервере перед логином.
 */
export function useMiniAppAuth(): void {
  const { login, isLoading } = useTelegramAuth();

  useEffect(() => {
    // Ждём пока useTelegramAuth загрузит данные из localStorage
    if (isLoading) return;

    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user || !tg.initData) return;

    fetch('/api/auth/telegram/miniapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ initData: tg.initData }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          login({
            id: data.user.id,
            firstName: data.user.firstName,
            lastName: data.user.lastName,
            username: data.user.username,
            photoUrl: data.user.photoUrl,
          });
        } else {
          console.warn('Mini App auth failed:', data.error);
        }
      })
      .catch(err => console.error('Mini App auth error:', err));
  }, [isLoading]); // запускаем когда isLoading стал false
}
