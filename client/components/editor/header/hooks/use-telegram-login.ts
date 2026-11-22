/**
 * @fileoverview Хук входа через Telegram: OIDC redirect или dev-форма.
 * @module components/editor/header/hooks/use-telegram-login
 */

import { useCallback } from 'react';
import { useTelegramAuth } from './use-telegram-auth';
import { useToast } from '@/hooks/use-toast';
import { useAppConfig } from '@/hooks/use-app-config';

/**
 * Хук входа через Telegram.
 * При telegram_widget — full-page OIDC redirect (работает во встроенном браузере Cursor).
 * При skipAuth — popup с dev-формой.
 *
 * @returns Объект с функцией handleTelegramLogin
 */
export function useTelegramLogin() {
  const { acceptSession } = useTelegramAuth();
  const { toast } = useToast();
  const { data: appConfig } = useAppConfig();
  const isDev = appConfig?.skipAuth ?? true;

  /**
   * Открывает вход: OIDC redirect или popup /api/auth/login.
   */
  const handleTelegramLogin = useCallback(async () => {
    if (isDev) {
      const w = 500;
      const h = 600;
      const left = window.innerWidth / 2 - w / 2;
      const top = window.innerHeight / 2 - h / 2;
      const popup = window.open(
        '/api/auth/login',
        'telegram_login',
        `width=${w},height=${h},left=${left},top=${top}`,
      );

      const onMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;
        if (event.data?.type !== 'telegram-auth') return;
        window.removeEventListener('message', onMessage);
        popup?.close();

        const user = event.data.user;
        try {
          if (event.data?.sessionReady && user) {
            await acceptSession(user, false);
            return;
          }

          const resp = await fetch('/api/auth/dev-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              id: user.id,
              firstName: user.firstName,
              username: user.username,
            }),
          });
          const data = await resp.json();
          if (data.success && data.user) {
            await acceptSession(data.user, Boolean(data.switched));
          } else {
            toast({
              title: 'Ошибка входа',
              description: data.error,
              variant: 'destructive',
            });
          }
        } catch {
          toast({
            title: 'Ошибка входа',
            description: 'Не удалось выполнить dev-login',
            variant: 'destructive',
          });
        }
      };

      window.addEventListener('message', onMessage);
      return;
    }

    const returnTo = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const startUrl = `/api/auth/telegram/start?return_to=${encodeURIComponent(returnTo || '/')}`;
    window.location.assign(startUrl);
  }, [acceptSession, isDev, toast]);

  return { handleTelegramLogin };
}
