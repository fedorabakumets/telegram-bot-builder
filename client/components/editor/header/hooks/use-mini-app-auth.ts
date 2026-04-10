/**
 * @fileoverview Хук автоматической авторизации через Telegram Mini App
 * @module components/editor/header/hooks/use-mini-app-auth
 */

import { useEffect } from 'react';
import { useTelegramAuth } from './use-telegram-auth';

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        /** Строка initData для верификации на сервере */
        initData: string;
        /** Распарсенные данные инициализации */
        initDataUnsafe: {
          /** Данные пользователя Telegram */
          user?: {
            /** Числовой ID пользователя */
            id: number;
            /** Имя пользователя */
            first_name: string;
            /** Фамилия пользователя */
            last_name?: string;
            /** Username пользователя */
            username?: string;
            /** URL аватара */
            photo_url?: string;
          };
        };
      };
    };
  }
}

/**
 * Хук автоматической авторизации через Telegram Mini App.
 * Если сайт открыт внутри Telegram — автоматически логинит пользователя.
 * Верифицирует initData на сервере перед логином.
 */
export function useMiniAppAuth(): void {
  const { login, user } = useTelegramAuth();

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (!tg?.initDataUnsafe?.user) return; // не Mini App или нет данных

    const tgUser = tg.initDataUnsafe.user;
    // Если уже залогинен тем же пользователем — пропускаем
    if (user && 'id' in user && user.id === tgUser.id) return;

    // Отправляем initData на сервер для верификации и авторизации
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
        }
      })
      .catch(err => console.error('Mini App auth error:', err));
  }, []); // только при монтировании
}
