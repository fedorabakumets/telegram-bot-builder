/**
 * @fileoverview Хук действий авторизации Telegram Client API
 *
 * Предоставляет функции: loadStatus, saveCredentials, logout, resetCredentials
 *
 * @module useTelegramAuthActions
 */

import { useToast } from '@/hooks/use-toast';
import type { AuthStatus, ApiCredentials } from '../types';
import { loadAuthStatus } from './load-auth-status';
import { saveCredentials as saveCredentialsFn } from './save-credentials';
import { logout as logoutFn } from './logout';
import { resetCredentials as resetCredentialsFn } from './reset-credentials';

/**
 * Параметры для создания действий авторизации
 */
export interface UseTelegramAuthActionsParams {
  /** Установить статус авторизации */
  setAuthStatus: (status: AuthStatus) => void;
  /** Установить API ID */
  setApiId: (value: string) => void;
  /** Установить API Hash */
  setApiHash: (value: string) => void;
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
}

/**
 * Результат работы хука useTelegramAuthActions
 */
export interface UseTelegramAuthActionsReturn {
  /** Загрузка статуса авторизации */
  loadStatus: () => Promise<void>;
  /** Сохранение API credentials */
  saveCredentials: (credentials: ApiCredentials) => Promise<void>;
  /** Выход из аккаунта */
  logout: () => Promise<void>;
  /** Сброс API credentials */
  resetCredentials: () => Promise<void>;
}

/**
 * Хук действий авторизации
 *
 * @param params - Параметры действий
 * @returns {UseTelegramAuthActionsReturn} Объект с функциями
 *
 * @example
 * ```tsx
 * const { loadStatus, saveCredentials, logout, resetCredentials } =
 *   useTelegramAuthActions({ setAuthStatus, setApiId, setApiHash, setIsLoading });
 * ```
 */
export function useTelegramAuthActions(
  params: UseTelegramAuthActionsParams
): UseTelegramAuthActionsReturn {
  const { setAuthStatus, setApiId, setApiHash, setIsLoading } = params;
  const { toast } = useToast();

  /**
   * Загрузка статуса авторизации
   */
  const loadStatus = async () => {
    try {
      const status = await loadAuthStatus();
      setAuthStatus(status);
    } catch (error) {
      console.error('Ошибка загрузки статуса:', error);
    }
  };

  /**
   * Сохранение API credentials
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
      const result = await saveCredentialsFn(credentials);
      toast({ title: 'Успешно', description: result.message });
      loadStatus();
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
   * Выход из аккаунта
   */
  const logout = async () => {
    setIsLoading(true);
    try {
      const result = await logoutFn();
      toast({ title: 'Выполнен выход', description: result.message });
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
      const result = await resetCredentialsFn();
      toast({ title: 'Сброшено', description: result.message });
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
    loadStatus,
    saveCredentials,
    logout,
    resetCredentials,
  };
}
