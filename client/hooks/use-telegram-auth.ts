import { useState, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

/**
 * Интерфейс данных пользователя Telegram
 * @interface TelegramUser
 * @property {number} id - Уникальный идентификатор пользователя
 * @property {string} firstName - Имя пользователя
 * @property {string} [lastName] - Фамилия пользователя (опционально)
 * @property {string} [username] - Имя пользователя (опционально)
 * @property {string} [photoUrl] - URL фотографии пользователя (опционально)
 */
export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

/**
 * Ключ для хранения данных пользователя в localStorage
 */
const STORAGE_KEY = 'telegramUser';

/**
 * Имя события для аутентификации через Telegram
 */
const AUTH_EVENT = 'telegram-auth-change';

/**
 * Хук для управления аутентификацией через Telegram
 *
 * @returns {Object} Объект с состоянием аутентификации и методами управления
 * @returns {TelegramUser | null} Object.user - Данные авторизованного пользователя или null
 * @returns {Function} Object.login - Функция для входа пользователя
 * @returns {Function} Object.logout - Функция для выхода пользователя
 * @returns {boolean} Object.isLoading - Состояние загрузки при инициализации
 *
 * @example
 * ```typescript
 * const { user, login, logout, isLoading } = useTelegramAuth();
 *
 * // Проверка аутентификации
 * if (user) {
 *   console.log(`Добро пожаловать, ${user.firstName}!`);
 * } else if (!isLoading) {
 *   console.log('Пользователь не авторизован');
 * }
 *
 * // Вход пользователя
 * const handleLogin = (userData: TelegramUser) => {
 *   login(userData);
 * };
 *
 * // Выход пользователя
 * const handleLogout = () => {
 *   logout();
 * };
 * ```
 */
export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Загружаем пользователя из localStorage при монтировании
  useEffect(() => {
    const loadUser = () => {
      try {
        const savedUser = localStorage.getItem(STORAGE_KEY);
        if (savedUser) {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Error loading user from localStorage:', e);
      }
      setIsLoading(false);
    };

    loadUser();

    // Слушаем custom event от TelegramLoginWidget
    const handleAuthChange = (e: any) => {
      try {
        if (e.detail.user) {
          setUser(e.detail.user);
          // Инвалидируем кеш шаблонов при изменении пользователя
          queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
          queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
          queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        } else {
          setUser(null);
          // Очищаем кеш при выходе
          queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
          queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
          queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
        }
      } catch (err) {
        console.error('Error in auth change handler:', err);
      }
    };

    // Слушаем изменения в localStorage от других вкладок
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        try {
          if (e.newValue) {
            const parsedUser = JSON.parse(e.newValue);
            setUser(parsedUser);
            queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
            queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
            queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
          } else {
            setUser(null);
            queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
            queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
            queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
          }
        } catch (err) {
          console.error('Error parsing user from storage event:', err);
        }
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
   * Функция для входа пользователя
   *
   * @param {TelegramUser} userData - Данные пользователя для входа
   */
  const login = (userData: TelegramUser) => {
    setUser(userData);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
      // КРИТИЧНО: Удаляем старый кеш гостя и инвалидируем новый для авторизованного пользователя
      queryClient.removeQueries({ queryKey: ['/api/templates/category/custom', 'guest'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom', userData.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    } catch (e) {
      console.error('Error saving user to localStorage:', e);
    }
  };

  /**
   * Функция для выхода пользователя
   *
   * @async
   * @returns {Promise<void>} Промис, который разрешается после завершения выхода
   */
  const logout = async () => {
    try {
      await fetch('/api/auth/telegram/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (e) {
      console.error('Logout error:', e);
    }
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      // Инвалидируем кеш при выходе
      queryClient.invalidateQueries({ queryKey: ['/api/templates/category/custom'] });
      queryClient.invalidateQueries({ queryKey: ['/api/templates'] });
      queryClient.invalidateQueries({ queryKey: ['/api/projects'] });
    } catch (e) {
      console.error('Error removing user from localStorage:', e);
    }
  };

  return { user, login, logout, isLoading };
}
