/**
 * @fileoverview Хук управления авторизацией через Telegram
 * Источник правды — серверная сессия (GET /api/auth/me через React Query).
 * @module components/editor/header/hooks/use-telegram-auth
 */

import { useEffect } from 'react';
import { queryClient } from '@/queryClient';
import type { AppUser, TelegramUser } from '@/types/telegram-user';
import { isGuest as checkIsGuest, isTelegramUser } from '@/types/telegram-user';
import { invalidateAuthQueries, clearUserCache } from '@/utils/invalidate-auth-queries';
import { normalizeTelegramUser } from '@/utils/normalize-telegram-user';
import { useToast } from '@/hooks/use-toast';
import { AUTH_ME_QUERY_KEY, useAuthMeQuery } from './use-auth-me-query';

export type { TelegramUser, AppUser };

/** Ключ хранения данных пользователя в localStorage (UI-кэш) */
const STORAGE_KEY = 'telegramUser';

/**
 * Данные для POST /api/auth/telegram
 */
export interface TelegramLoginPayload extends TelegramUser {
  /** OIDC id_token от Telegram Login Widget */
  idToken?: string;
  /** Unix timestamp auth_date */
  authDate?: number;
}

/**
 * Хук управления авторизацией.
 * GET /api/auth/me — один запрос на вкладку (React Query); localStorage — только UI-кэш.
 *
 * @returns Объект с пользователем, login/logout, флагами загрузки и sessionReady
 */
export function useTelegramAuth() {
  const { toast } = useToast();
  const { data: user = null, isLoading, isSuccess } = useAuthMeQuery();
  const sessionReady = isSuccess;

  useEffect(() => {
    if (!isSuccess) return;
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      /* ignore */
    }
  }, [user, isSuccess]);

  useEffect(() => {
    /**
     * Синхронизирует кэш /me при изменении localStorage в другой вкладке
     * @param e - StorageEvent
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        const parsed = e.newValue
          ? (JSON.parse(e.newValue) as TelegramUser)
          : null;
        queryClient.setQueryData(AUTH_ME_QUERY_KEY, parsed);
        invalidateAuthQueries(queryClient);
      } catch (err) {
        console.error('Ошибка разбора пользователя из StorageEvent:', err);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  /**
   * Синхронизирует клиентское состояние после уже созданной серверной сессии
   * (dev-login / ответ POST /telegram).
   *
   * @param rawUser - Пользователь с сервера
   * @param switched - Была ли смена аккаунта
   */
  const acceptSession = async (
    rawUser: Record<string, unknown> | TelegramUser,
    switched = false,
  ): Promise<void> => {
    const loggedIn = normalizeTelegramUser(rawUser as Record<string, unknown>);
    if (!loggedIn) return;

    clearUserCache(queryClient);
    queryClient.setQueryData(AUTH_ME_QUERY_KEY, loggedIn);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedIn));
    } catch (e) {
      console.error('Ошибка сохранения пользователя в localStorage:', e);
    }

    invalidateAuthQueries(queryClient);

    await Promise.all([
      queryClient.refetchQueries({ queryKey: ['/api/projects'] }),
      queryClient.refetchQueries({ queryKey: ['/api/projects/list'] }),
    ]);

    toast({
      title: switched
        ? `Вы вошли как ${loggedIn.firstName}`
        : `Добро пожаловать, ${loggedIn.firstName}!`,
    });
  };

  /**
   * Логин / смена аккаунта через POST /api/auth/telegram.
   * Ждёт success до объявления пользователя залогиненным.
   *
   * @param userData - Данные пользователя и опциональный idToken
   * @returns Промис с результатом
   */
  const login = async (userData: TelegramLoginPayload): Promise<boolean> => {
    const previousId =
      user && isTelegramUser(user) ? Number(user.id) : null;

    try {
      const resp = await fetch('/api/auth/telegram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: userData.id,
          first_name: userData.firstName,
          last_name: userData.lastName,
          username: userData.username,
          photo_url: userData.photoUrl,
          auth_date: userData.authDate,
          id_token: userData.idToken,
        }),
      });
      const data = await resp.json();

      if (!data.success) {
        console.error('Ошибка создания серверной сессии:', data.error);
        toast({
          title: 'Ошибка входа',
          description: data.error || 'Не удалось войти',
          variant: 'destructive',
        });
        return false;
      }

      const loggedIn = normalizeTelegramUser(data.user) ?? {
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName,
        username: userData.username,
        photoUrl: userData.photoUrl,
      };

      const switched =
        data.switched === true ||
        (previousId !== null && previousId !== Number(loggedIn.id));

      await acceptSession(loggedIn, switched);
      return true;
    } catch (e) {
      console.error('Ошибка POST /api/auth/telegram:', e);
      toast({
        title: 'Ошибка входа',
        description: 'Не удалось выполнить вход',
        variant: 'destructive',
      });
      return false;
    }
  };

  /**
   * Выход: уничтожает серверную сессию и очищает локальный кэш
   * @returns Промис после выхода
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch (e) {
      console.error('Ошибка выхода:', e);
    }

    queryClient.setQueryData(AUTH_ME_QUERY_KEY, null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      clearUserCache(queryClient);
      invalidateAuthQueries(queryClient);
    } catch (e) {
      console.error('Ошибка очистки после выхода:', e);
    }

    toast({ title: 'Вы вышли из аккаунта' });
  };

  /**
   * Смена аккаунта: открывает тот же login flow (вызывающий код — виджет).
   * Alias для ясности API; фактически login с новым пользователем.
   *
   * @param userData - Данные нового пользователя
   * @returns Промис с результатом
   */
  const switchAccount = (userData: TelegramLoginPayload) => login(userData);

  return {
    user,
    login,
    logout,
    switchAccount,
    acceptSession,
    isLoading,
    sessionReady,
    isGuest: checkIsGuest,
    isTelegramUser,
  };
}
