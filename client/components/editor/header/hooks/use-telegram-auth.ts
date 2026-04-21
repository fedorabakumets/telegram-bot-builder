/**
 * @fileoverview Хук управления авторизацией через Telegram с поддержкой гостевого режима
 * @module components/editor/header/hooks/use-telegram-auth
 */

import { useState, useEffect } from 'react';
import { queryClient } from '@/queryClient';
import type { AppUser, TelegramUser } from '@/types/telegram-user';
import { isGuest as checkIsGuest, isTelegramUser } from '@/types/telegram-user';
import { invalidateAuthQueries } from '@/utils/invalidate-auth-queries';

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
 * @returns Объект с пользователем, методами login/logout, флагом загрузки и хелпером isGuest
 */
export function useTelegramAuth() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsedUser = saved ? JSON.parse(saved) : null;
      // Если нет сохранённого пользователя — устанавливаем гостя
      setUser(parsedUser ?? GUEST_USER);

      // Восстанавливаем серверную сессию если пользователь уже авторизован
      if (parsedUser && !checkIsGuest(parsedUser)) {
        fetch('/api/auth/telegram', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            id: parsedUser.id,
            first_name: parsedUser.firstName,
            last_name: parsedUser.lastName,
            username: parsedUser.username,
            photo_url: parsedUser.photoUrl,
          }),
        }).catch(e => console.error('Ошибка восстановления серверной сессии:', e));
      }
    } catch (e) {
      console.error('Ошибка загрузки пользователя из localStorage:', e);
      setUser(GUEST_USER);
    }
    setIsLoading(false);

    /**
     * Обрабатывает custom-событие смены авторизации
     * @param e - CustomEvent с полем detail.user
     */
    const handleAuthChange = (e: any) => {
      try {
        setUser(e.detail.user ?? GUEST_USER);
        invalidateAuthQueries(queryClient);
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
      queryClient.removeQueries({ queryKey: ['/api/templates/category/custom', 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom', userData.id] });
      invalidateAuthQueries(queryClient);
    } catch (e) {
      console.error('Ошибка сохранения пользователя в localStorage:', e);
    }

    // Создаём серверную сессию — без этого owner_id проектов остаётся null
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
      invalidateAuthQueries(queryClient);
    } catch (e) {
      console.error('Ошибка удаления пользователя из localStorage:', e);
    }
  };

  return { user, login, logout, isLoading, isGuest: checkIsGuest, isTelegramUser };
}
