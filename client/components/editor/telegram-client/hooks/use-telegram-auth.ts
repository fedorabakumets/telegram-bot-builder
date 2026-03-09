/**
 * @fileoverview Хук управления авторизацией Telegram Client API
 *
 * Композиция хуков: state + actions
 *
 * @module useTelegramAuth
 */

import { useEffect } from 'react';
import type { AuthStatus, ApiCredentials } from '../types';
import { useTelegramAuthState } from './use-telegram-auth-state';
import { useTelegramAuthActions } from './use-telegram-auth-actions';

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
  /** Установить значение API ID */
  setApiId: (value: string) => void;
  /** Установить значение API Hash */
  setApiHash: (value: string) => void;
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
  const {
    authStatus,
    apiId,
    apiHash,
    isLoading,
    showAuthDialog,
    setAuthStatus,
    setApiId,
    setApiHash,
    setIsLoading,
    setShowAuthDialog,
  } = useTelegramAuthState();

  const { loadStatus, saveCredentials, logout, resetCredentials } =
    useTelegramAuthActions({ setAuthStatus, setApiId, setApiHash, setIsLoading });

  useEffect(() => {
    loadStatus();
  }, []);

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
    setApiId,
    setApiHash,
  };
}
