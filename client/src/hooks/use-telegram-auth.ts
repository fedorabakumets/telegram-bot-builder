import { useState, useEffect } from 'react';
import { queryClient } from '@/lib/queryClient';

export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}

const STORAGE_KEY = 'telegramUser';
const AUTH_EVENT = 'telegram-auth-change';

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
