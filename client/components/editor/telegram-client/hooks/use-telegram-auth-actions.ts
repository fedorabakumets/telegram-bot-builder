/**
 * @fileoverview Хук действий авторизации Telegram Client API
 *
 * Использует фабрики для создания функций действий.
 *
 * @module useTelegramAuthActions
 */

import { useToast } from '@/hooks/use-toast';
import type { AuthStatus, ApiCredentials } from '../types';
import {
  createLoadStatusHandler,
  createSaveCredentialsHandler,
  createLogoutHandler,
  createResetCredentialsHandler,
} from './actions';

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
  useToast();

  const loadStatus = createLoadStatusHandler({ setAuthStatus });
  const loadStatusWithToast = async () => {
    await loadStatus();
  };

  const saveCredentials = createSaveCredentialsHandler({
    setIsLoading,
    loadStatus: loadStatusWithToast,
  });

  const logout = createLogoutHandler({
    setIsLoading,
    loadStatus: loadStatusWithToast,
  });

  const resetCredentials = createResetCredentialsHandler({
    setIsLoading,
    setApiId,
    setApiHash,
    loadStatus: loadStatusWithToast,
  });

  return {
    loadStatus: loadStatusWithToast,
    saveCredentials,
    logout,
    resetCredentials,
  };
}
