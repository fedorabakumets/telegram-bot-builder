/**
 * @fileoverview Хук управления авторизацией Telegram Client API
 *
 * Предоставляет состояние и методы для работы с авторизацией:
 * - Загрузка статуса авторизации
 * - Сохранение API credentials
 * - Выход из аккаунта
 * - Сброс credentials
 *
 * @module useTelegramAuth
 */

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { AuthStatus, ApiCredentials } from '../types';

/**
 * Результат работы хука useTelegramAuth
 */
export interface UseTelegramAuthReturn {
  /** Статус авторизации */
  authStatus: AuthStatus;
  /** Значение API ID */
  apiId: string;
  /** Значение API Hash */
  apiHash: string;
  /** Статус загрузки операции */
  isLoading: boolean;
  /** Показать диалог авторизации */
  showAuthDialog: boolean;
  /** Функция загрузки статуса авторизации */
  loadStatus: () => Promise<void>;
  /** Функция сохранения API credentials */
  saveCredentials: (credentials: ApiCredentials) => Promise<void>;
  /** Функция выхода из аккаунта */
  logout: () => Promise<void>;
  /** Функция сброса API credentials */
  resetCredentials: () => Promise<void>;
  /** Установить состояние диалога авторизации */
  setShowAuthDialog: (show: boolean) => void;
}

/**
 * Хук для управления авторизацией Telegram Client API
 *
 * @returns {UseTelegramAuthReturn} Объект с состоянием и методами
 *
 * @example
 * ```tsx
 * const {
 *   authStatus,
 *   apiId,
 *   apiHash,
 *   isLoading,
 *   saveCredentials,
 *   logout,
 *   loadStatus
 * } = useTelegramAuth();
 * ```
 */
export function useTelegramAuth(): UseTelegramAuthReturn {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    hasCredentials: false,
  });
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
  const { toast } = useToast();

  /**
   * Загрузка статуса авторизации
   */
  const loadStatus = async () => {
    try {
      const response = await fetch('/api/telegram-auth/status');
      const status = await response.json();
      setAuthStatus(status);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  /**
   * Сохранение API credentials
   * @param credentials - API ID и API Hash
   */
  const saveCredentials = async (credentials: ApiCredentials) => {
    if (!credentials.apiId.trim() || !credentials.apiHash.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Заполните API ID и API Hash',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await apiRequest('POST', '/api/telegram-auth/save-credentials', credentials);
      if (result.success) {
        toast({ title: 'Успешно', description: 'API credentials сохранены' });
        loadStatus();
      }
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сохранить credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Выход из аккаунта Client API
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/telegram-auth/logout');
      toast({
        title: 'Выполнен выход',
        description: 'Вы успешно вышли из аккаунта',
      });
      loadStatus();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось выполнить выход',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Сброс API credentials
   */
  const resetCredentials = async () => {
    setIsLoading(true);
    try {
      await apiRequest('POST', '/api/telegram-auth/reset-credentials');
      toast({
        title: 'Сброшено',
        description: 'API credentials удалены. Введите новые данные',
      });
      setApiId('');
      setApiHash('');
      loadStatus();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось сбросить credentials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    authStatus,
    apiId,
    apiHash,
    isLoading,
    showAuthDialog,
    loadStatus,
    saveCredentials,
    logout,
    resetCredentials,
    setShowAuthDialog,
  };
}
