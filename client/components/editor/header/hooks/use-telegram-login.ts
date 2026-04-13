/**
 * @fileoverview Хук инициализации и открытия Telegram Login виджета
 * @module components/editor/header/hooks/use-telegram-login
 */

import { useEffect, useCallback, useRef } from 'react';
import { useTelegramAuth } from './use-telegram-auth';
import { useToast } from '@/hooks/use-toast';

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
const TELEGRAM_LOGIN_SRC = 'https://oauth.telegram.org/js/telegram-login.js?3';
const TELEGRAM_LOGIN_SCRIPT_ID = 'telegram-login-sdk';

function waitForTelegramLogin(timeoutMs: number): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (typeof window.Telegram?.Login?.init === 'function') return Promise.resolve(true);

  return new Promise((resolve) => {
    const startedAt = Date.now();
    const tick = () => {
      if (typeof window.Telegram?.Login?.init === 'function') {
        resolve(true);
        return;
      }
      if (Date.now() - startedAt >= timeoutMs) {
        resolve(false);
        return;
      }
      setTimeout(tick, 120);
    };
    tick();
  });
}

function ensureTelegramLogin(timeoutMs = 2500): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (typeof window.Telegram?.Login?.init === 'function') return Promise.resolve(true);

  const existing = document.getElementById(TELEGRAM_LOGIN_SCRIPT_ID) as HTMLScriptElement | null;
  if (existing) {
    return waitForTelegramLogin(timeoutMs);
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.id = TELEGRAM_LOGIN_SCRIPT_ID;
    script.async = true;
    script.src = TELEGRAM_LOGIN_SRC;
    script.onload = () => {
      waitForTelegramLogin(timeoutMs).then(resolve);
    };
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Хук инициализации Telegram Login виджета.
 * В dev-режиме (виджет недоступен) открывает старый popup /api/auth/login.
 *
 * @returns Объект с функцией handleTelegramLogin
 */
export function useTelegramLogin() {
  const { login } = useTelegramAuth();
  const { toast } = useToast();
  const didInit = useRef(false);
  const isDev = import.meta.env?.MODE === 'development';

  const init = useCallback(() => {
    if (didInit.current) return;
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
    didInit.current = true;
  }, [login]);

  useEffect(() => {
    if (typeof window.Telegram?.Login?.init === 'function') {
      init();
    }
  }, [init]);

  /**
   * Открывает диалог авторизации Telegram.
   * В dev-режиме — всегда открывает popup /api/auth/login с dev-формой.
   * В prod — использует Telegram Login виджет.
   */
  const handleTelegramLogin = useCallback(async () => {
    // В dev-режиме всегда используем dev-форму, не ждём виджет
    if (isDev) {
      const w = 500, h = 600;
      const left = window.innerWidth / 2 - w / 2;
      const top = window.innerHeight / 2 - h / 2;
      const popup = window.open('/api/auth/login', 'telegram_login', `width=${w},height=${h},left=${left},top=${top}`);

      /**
       * Обрабатывает postMessage от popup с данными пользователя.
       * @param event - MessageEvent с полем data.type === 'telegram-auth'
       */
      const onMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'telegram-auth') return;
        window.removeEventListener('message', onMessage);
        popup?.close();

        const user = event.data.user;
        try {
          const resp = await fetch('/api/auth/dev-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: user.id, firstName: user.firstName, username: user.username }),
          });
          const data = await resp.json();
          if (data.success && data.user) {
            login(data.user);
          } else {
            toast({ title: 'Ошибка входа', description: data.error, variant: 'destructive' });
          }
        } catch (e) {
          toast({ title: 'Ошибка входа', description: 'Не удалось выполнить dev-login', variant: 'destructive' });
        }
      };

      window.addEventListener('message', onMessage);
      return;
    }

    // Prod: используем Telegram Login виджет
    const ready = await ensureTelegramLogin();
    if (!ready || typeof window.Telegram?.Login?.open !== 'function') {
      toast({
        title: 'Telegram недоступен',
        description: 'Не удалось загрузить виджет. Откройте сайт в Telegram или попробуйте позже.',
        variant: 'destructive',
      });
      return;
    }

    init();
    window.Telegram.Login.open();
  }, [init, isDev, login, toast]);

  return { handleTelegramLogin };
}
