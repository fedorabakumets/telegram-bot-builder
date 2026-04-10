/**
 * @fileoverview Хук слушателя postMessage авторизации Telegram
 * @module components/editor/header/hooks/use-telegram-auth-listener
 */

import { useEffect } from 'react';
import { useTelegramAuth } from './use-telegram-auth';

/**
 * Подключает глобальный обработчик window.postMessage для авторизации через Telegram.
 * Должен монтироваться один раз на верхнем уровне приложения (например, в AdaptiveHeader).
 *
 * Ожидает сообщения вида: `{ type: 'telegram-auth', user: TelegramUser }`
 */
export function useTelegramAuthListener(): void {
  const { login } = useTelegramAuth();

  useEffect(() => {
    /**
     * Обрабатывает входящее postMessage от popup-окна авторизации
     * @param event - MessageEvent с данными пользователя
     */
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'telegram-auth' && event.data?.user) {
        login(event.data.user);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [login]);
}
