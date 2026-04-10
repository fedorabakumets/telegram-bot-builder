/**
 * @fileoverview Хук инициализации и открытия Telegram Login виджета
 * @module components/editor/header/hooks/use-telegram-login
 */

import { useEffect, useCallback } from 'react';
import { useTelegramAuth } from './use-telegram-auth';

declare global {
  interface Window {
    Telegram?: {
      Login?: {
        /** Инициализирует виджет с параметрами и колбэком */
        init: (options: object, callback: (data: any) => void) => void;
        /** Открывает диалог авторизации */
        open: (callback?: (data: any) => void) => void;
        /** Альтернативный метод авторизации */
        auth: (options: object, callback: (data: any) => void) => void;
      };
      WebApp?: {
        /** Строка initData для верификации на сервере */
        initData: string;
        /** Распарсенные данные инициализации */
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        /** Разворачивает приложение на весь экран */
        expand?: () => void;
        /** Сигнализирует Telegram что приложение готово */
        ready?: () => void;
      };
    };
  }
}

/** Идентификатор Telegram-приложения */
const CLIENT_ID = 7713154819;

/**
 * Хук инициализации Telegram Login виджета.
 * В dev-режиме (виджет недоступен) открывает старый popup /api/auth/login.
 *
 * @returns Объект с функцией handleTelegramLogin
 */
export function useTelegramLogin() {
  const { login } = useTelegramAuth();

  useEffect(() => {
    /**
     * Инициализирует Telegram.Login с колбэком авторизации
     */
    const init = () => {
      if (typeof window.Telegram?.Login?.init !== 'function') return;
      window.Telegram.Login.init(
        { client_id: CLIENT_ID, request_access: ['write'] },
        (data: any) => {
          if (!data || data.error) return;
          // Маппим поля из id_token payload или user объекта
          const user = data.user ?? data;
          login({
            id: user.id ?? user.sub,
            firstName: user.first_name ?? user.name ?? '',
            lastName: user.last_name,
            username: user.username ?? user.preferred_username,
            photoUrl: user.photo_url ?? user.picture,
          });
        }
      );
    };

    if (typeof window.Telegram?.Login?.init === 'function') {
      init();
    } else {
      // Ждём загрузки скрипта виджета
      window.addEventListener('load', init, { once: true });
    }
  }, [login]);

  /**
   * Открывает диалог авторизации Telegram.
   * Если виджет недоступен (dev-режим) — открывает popup /api/auth/login.
   */
  const handleTelegramLogin = useCallback(() => {
    if (window.Telegram?.Login?.open) {
      window.Telegram.Login.open();
    } else {
      // Dev fallback — старый popup
      const w = 500, h = 600;
      const left = window.innerWidth / 2 - w / 2;
      const top = window.innerHeight / 2 - h / 2;
      window.open('/api/auth/login', 'telegram_login', `width=${w},height=${h},left=${left},top=${top}`);
    }
  }, []);

  return { handleTelegramLogin };
}
