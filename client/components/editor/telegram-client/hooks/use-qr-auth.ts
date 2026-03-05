/**
 * @fileoverview Хук управления QR авторизацией Telegram
 *
 * Композиция функций для генерации и проверки QR-кода.
 *
 * @module useQrAuth
 */

import { useState } from 'react';
import type { QrState } from '../types';
import { generateQrCode, checkQrStatus, refreshQrToken } from './qr-actions';

/**
 * Результат работы хука useQrAuth
 */
export interface UseQrAuthReturn {
  /** Состояние QR-кода */
  qrState: QrState;
  /** Статус загрузки */
  isLoading: boolean;
  /** Генерация QR-кода */
  generateQrCode: (password?: string) => Promise<void>;
  /** Проверка статуса QR */
  checkQrStatus: () => Promise<void>;
  /** Обновление QR-токена */
  refreshQrToken: () => Promise<void>;
  /** Установить пароль 2FA */
  setQrPassword: (value: string) => void;
  /** Сброс состояния QR */
  resetQrState: () => void;
}

/**
 * Хук управления QR авторизацией
 *
 * @param onSuccess - Коллбэк успешной авторизации
 * @param onOpenChange - Управление состоянием диалога
 * @returns {UseQrAuthReturn} Объект с состоянием и методами
 */
export function useQrAuth(
  onSuccess: () => void,
  onOpenChange: (open: boolean) => void
): UseQrAuthReturn {
  const [qrState, setQrState] = useState<QrState>({
    token: '',
    url: '',
    password: '',
    countdown: 30,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateQrCode = async (password?: string) => {
    await generateQrCode({ setQrState, setIsLoading, password });
  };

  const handleCheckQrStatus = async () => {
    await checkQrStatus({
      token: qrState.token,
      password: qrState.password,
      setIsLoading,
      onSuccess,
      onOpenChange,
      resetQrState,
    });
  };

  const handleRefreshQrToken = async () => {
    await refreshQrToken({ setQrState });
  };

  const resetQrState = () => {
    setQrState({ token: '', url: '', password: '', countdown: 30 });
  };

  return {
    qrState,
    isLoading,
    generateQrCode: handleGenerateQrCode,
    checkQrStatus: handleCheckQrStatus,
    refreshQrToken: handleRefreshQrToken,
    setQrPassword: (value: string) =>
      setQrState((prev) => ({ ...prev, password: value })),
    resetQrState,
  };
}
