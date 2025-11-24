import { useState, useEffect } from 'react';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

export function useTelegramAuth() {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Загружаем пользователя с сервера при монтировании (опционально)
  // TODO: реализовать загрузку из БД через эндпоинт GET /api/auth/telegram/me после проверки сессии
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = (userData: TelegramUser) => {
    setUser(userData);
  };

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
  };

  return { user, login, logout, isLoading };
}
