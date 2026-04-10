/**
 * @fileoverview Хук для входа через Telegram
 * @description Открывает popup авторизации и слушает postMessage с данными пользователя
 */

import { useEffect } from 'react';
import { useTelegramAuth } from './use-telegram-auth';

/** Параметры окна авторизации */
const LOGIN_WINDOW_CONFIG = {
  width: 500,
  height: 600,
} as const;

/**
 * Хук для управления входом через Telegram
 * Открывает popup и обрабатывает ответ через window.postMessage
 * @returns Объект с функцией handleTelegramLogin
 */
export function useTelegramLogin() {
  const { login } = useTelegramAuth();

  useEffect(() => {
    /**
     * Обрабатывает сообщение от popup-окна авторизации
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

  /**
   * Открывает окно авторизации Telegram в центре экрана
   */
  const handleTelegramLogin = () => {
    const { width, height } = LOGIN_WINDOW_CONFIG;
    const left = window.innerWidth / 2 - width / 2;
    const top = window.innerHeight / 2 - height / 2;

    window.open(
      '/api/auth/login',
      'telegram_login',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  return { handleTelegramLogin };
}
