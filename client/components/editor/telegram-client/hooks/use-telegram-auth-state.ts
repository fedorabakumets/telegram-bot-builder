/**
 * @fileoverview Хук состояния авторизации Telegram Client API
 *
 * Управляет состоянием: authStatus, apiId, apiHash, isLoading, showAuthDialog
 *
 * @module useTelegramAuthState
 */

import { useState } from 'react';
import type { AuthStatus } from '../types';

/**
 * Результат работы хука useTelegramAuthState
 */
export interface UseTelegramAuthStateReturn {
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
  /** Установить статус авторизации */
  setAuthStatus: (status: AuthStatus) => void;
  /** Установить значение API ID */
  setApiId: (value: string) => void;
  /** Установить значение API Hash */
  setApiHash: (value: string) => void;
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Установить состояние диалога */
  setShowAuthDialog: (value: boolean) => void;
}

/**
 * Хук управления состоянием авторизации
 *
 * @returns {UseTelegramAuthStateReturn} Объект с состоянием и сеттерами
 *
 * @example
 * ```tsx
 * const {
 *   authStatus,
 *   apiId,
 *   setApiId,
 *   isLoading,
 *   setIsLoading
 * } = useTelegramAuthState();
 * ```
 */
export function useTelegramAuthState(): UseTelegramAuthStateReturn {
  const [authStatus, setAuthStatus] = useState<AuthStatus>({
    isAuthenticated: false,
    hasCredentials: false,
  });
  const [apiId, setApiId] = useState('');
  const [apiHash, setApiHash] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthDialog, setShowAuthDialog] = useState(false);

  return {
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
  };
}
