/**
 * @fileoverview Хук управления QR авторизацией Telegram
 *
 * Композиция функций для генерации и проверки QR-кода.
 *
 * @module useQrAuth
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import type { QrState } from '../types';
import { generateQrCode, checkQrStatus, refreshQrToken } from './qr-actions';
import { QR_TOKEN_EXPIRY } from '../constants';
import { createNotificationService } from '../services';

/**
 * Результат работы хука useQrAuth
 */
export interface UseQrAuthReturn {
  /** Состояние QR-кода */
  qrState: QrState;
  /** Статус загрузки */
  isLoading: boolean;
  /** Статус обновления QR */
  isRefreshing: boolean;
  /** Текущий шаг авторизации */
  step: 'start' | 'qr' | 'qr-password';
  /** Генерация QR-кода */
  generateQrCode: (password?: string) => Promise<{ success: boolean; requiresPassword?: boolean } | void>;
  /** Проверка статуса QR */
  checkQrStatus: () => Promise<void>;
  /** Обновление QR-токена */
  refreshQrToken: () => Promise<void>;
  /** Установить пароль 2FA */
  setQrPassword: (value: string) => void;
  /** Сброс состояния QR */
  resetQrState: () => void;
  /** Переключение на шаг ввода 2FA пароля */
  goToPasswordStep: () => void;
  /** Переключение на начальный шаг */
  goToStartStep: () => void;
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
    countdown: QR_TOKEN_EXPIRY,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [step, setStep] = useState<'start' | 'qr' | 'qr-password'>('start');
  const { toast } = useToast();
  const notifications = createNotificationService(toast);

  const handleGenerateQrCode = async (password?: string): Promise<{ success: boolean; requiresPassword?: boolean } | void> => {
    return await generateQrCode({ setQrState, setIsLoading, notifications, password, setStep });
  };

  const handleGoToPasswordStep = () => {
    setStep('qr-password');
  };

  const handleGoToStartStep = () => {
    setStep('start');
  };

  const handleCheckQrStatus = async () => {
    await checkQrStatus({
      token: qrState.token,
      password: qrState.password,
      setIsLoading,
      notifications,
      onSuccess,
      onOpenChange,
      resetQrState,
      onNeedsPassword: handleGoToPasswordStep,
    });
  };

  const handleRefreshQrToken = async () => {
    setIsRefreshing(true);
    try {
      await refreshQrToken({ setQrState, setIsLoading, notifications });
    } finally {
      setIsRefreshing(false);
    }
  };

  const resetQrState = () => {
    setQrState({ token: '', url: '', password: '', countdown: QR_TOKEN_EXPIRY });
    setIsRefreshing(false);
  };

  return {
    qrState,
    isLoading,
    isRefreshing,
    step,
    generateQrCode: handleGenerateQrCode,
    checkQrStatus: handleCheckQrStatus,
    refreshQrToken: handleRefreshQrToken,
    setQrPassword: (value: string) =>
      setQrState((prev) => ({ ...prev, password: value })),
    resetQrState,
    goToPasswordStep: handleGoToPasswordStep,
    goToStartStep: handleGoToStartStep,
  };
}
