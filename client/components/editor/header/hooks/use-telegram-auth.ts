/**
 * @fileoverview Хук управления авторизацией через Telegram с поддержкой гостевого режима
 * @module components/editor/header/hooks/use-telegram-auth
 */

import { useState, useEffect } from 'react';
import { queryClient } from '@/queryClient';
import type { AppUser, TelegramUser } from '@/types/telegram-user';
import { isGuest as checkIsGuest, isTelegramUser } from '@/types/telegram-user';
import { invalidateAuthQueries } from '@/utils/invalidate-auth-queries';
import { clearUserCache } from '@/utils/invalidate-auth-queries';
import { restoreSession, resetSessionRestore } from '@/utils/session-restore';

export type { TelegramUser, AppUser };

/** Ключ хранения данных пользователя в localStorage */
const STORAGE_KEY = 'telegramUser';

/** Имя события смены авторизации */
const AUTH_EVENT = 'telegram-auth-change';

/** Объект гостевого пользователя */
const GUEST_USER: AppUser = { isGuest: true };


/**
 * Хук управления авторизацией.
 * При отсутствии сохранённого пользователя автоматически устанавливает гостевой режим.
 *
 * @returns Объект с пользователем, методами login/logout, флагом загрузки, хелпером isGuest и флагом sessionReady
 */
export function useTelegramAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  /** true когда серверная сессия точно готова (или пользователь гость) */
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsedUser = saved ? JSON.parse(saved) : null;
      // Если нет сохранённого пользователя — устанавливаем гостя
      setUser(parsedUser ?? GUEST_USER);

      // Singleton restoreSession гарантирует единственный fetch за жизнь страницы
      if (parsedUser && !checkIsGuest(parsedUser)) {
        restoreSession(parsedUser).finally(() => {
          // Каждый экземпляр хука сбрасывает кеш перед своим первым запросом
          queryClient.removeQueries({ queryKey: ['/api/projects'] });
          queryClient.removeQueries({ queryKey: ['/api/projects/list'] });
          setSessionReady(true);
        });
      } else {
        // Гость — сразу разрешаем запросы
        setSessionReady(true);
      }
    } catch (e) {
      console.error('Ошибка загрузки пользователя из localStorage:', e);
      setUser(GUEST_USER);
      setSessionReady(true);
    }
    setIsLoading(false);

    /**
     * Обрабатывает custom-событие смены авторизации
     * @param e - CustomEvent с полем detail.user
     */
    const handleAuthChange = (e: any) => {
      try {
        const newUser = e.detail.user ?? GUEST_USER;
        setUser(newUser);
        if (newUser && !checkIsGuest(newUser)) {
          // Сбрасываем sessionReady — ждём завершения рефетча проектов
          setSessionReady(false);
          invalidateAuthQueries(queryClient);
          // Сначала сбрасываем кеш проектов, потом рефетчим и разблокируем
          queryClient.removeQueries({ queryKey: ['/api/projects'] });
          queryClient.removeQueries({ queryKey: ['/api/projects/list'] });
          Promise.all([
            queryClient.refetchQueries({ queryKey: ['/api/projects'] }),
            queryClient.refetchQueries({ queryKey: ['/api/projects/list'] }),
          ]).finally(() => setSessionReady(true));
        } else {
          invalidateAuthQueries(queryClient);
        }
      } catch (err) {
        console.error('Ошибка обработки события авторизации:', err);
      }
    };

    /**
     * Обрабатывает изменение localStorage из другой вкладки
     * @param e - StorageEvent
     */
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      try {
        setUser(e.newValue ? JSON.parse(e.newValue) : GUEST_USER);
        invalidateAuthQueries(queryClient);
      } catch (err) {
        console.error('Ошибка разбора пользователя из StorageEvent:', err);
      }
    };

    window.addEventListener(AUTH_EVENT, handleAuthChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener(AUTH_EVENT, handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  /**
   * Сохраняет пользователя локально и создаёт серверную сессию через POST /api/auth/telegram.
   * Без серверной сессии owner_id проектов остаётся null.
   * @param userData - Данные пользователя Telegram для входа
   */
  const login = (userData: TelegramUser) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      // Очищаем кеш предыдущего пользователя перед загрузкой данных нового
      clearUserCache(queryClient);
      queryClient.removeQueries({ queryKey: ['/api/templates/category/custom', 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom', userData.id] });
      invalidateAuthQueries(queryClient);
      // Оповещаем все экземпляры хука (в т.ч. AuthGuard) о входе
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: userData } }));
    } catch (e) {
      console.error('Ошибка сохранения пользователя в localStorage:', e);
    }

    // Создаём серверную сессию — без этого owner_id проектов остаётся null
    // Рефетч проектов выполняется ПОСЛЕ успешного создания сессии
    fetch('/api/auth/telegram', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        id: userData.id,
        first_name: userData.firstName,
        last_name: userData.lastName,
        username: userData.username,
        photo_url: userData.photoUrl,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (!data.success) {
          console.error('Ошибка создания серверной сессии:', data.error);
        } else {
          // Сессия готова — сбрасываем кеш (запросы сделают рефетч сами через invalidateAuthQueries)
          queryClient.removeQueries({ queryKey: ['/api/projects'] });
          queryClient.removeQueries({ queryKey: ['/api/projects/list'] });
          queryClient.refetchQueries({ queryKey: ['/api/projects'] });
          queryClient.refetchQueries({ queryKey: ['/api/projects/list'] });
        }
      })
      .catch(e => console.error('Ошибка POST /api/auth/telegram:', e));
  };

  /**
   * Выполняет выход: очищает сессию, localStorage и устанавливает гостя
   * @returns Промис, завершающийся после выхода
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/telegram/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
    } catch (e) {
      console.error('Ошибка выхода:', e);
    }
    setUser(GUEST_USER);
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Сбрасываем singleton сессии — при следующем логине восстановление запустится заново
      resetSessionRestore();
      // Очищаем весь кеш пользователя при выходе
      clearUserCache(queryClient);
      invalidateAuthQueries(queryClient);
      // Оповещаем все экземпляры хука (в т.ч. AuthGuard) о выходе
      window.dispatchEvent(new CustomEvent(AUTH_EVENT, { detail: { user: GUEST_USER } }));
    } catch (e) {
      console.error('Ошибка удаления пользователя из localStorage:', e);
    }
  };

  return { user, login, logout, isLoading, sessionReady, isGuest: checkIsGuest, isTelegramUser };
}
