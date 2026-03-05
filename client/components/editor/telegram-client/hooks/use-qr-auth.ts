/**
 * @fileoverview Хук управления QR авторизацией Telegram
 *
 * Предоставляет состояние и методы для генерации и проверки QR-кода.
 *
 * @module useQrAuth
 */

import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import type { QrState } from '../types';

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
  const { toast } = useToast();

  /**
   * Генерация QR-кода
   */
  const generateQrCode = async (password?: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/qr-generate', {
        password: password || '',
      });

      if (response.success) {
        if (response.requiresPassword) {
          toast({
            title: 'Требуется 2FA',
            description: 'Введите пароль двухфакторной аутентификации',
          });
        } else if (response.token && response.qrUrl) {
          setQrState({
            token: response.token,
            url: response.qrUrl,
            password: password || '',
            countdown: response.expires || 30,
          });
          toast({
            title: 'QR-код сгенерирован',
            description: 'Отсканируйте QR-код в приложении Telegram',
          });
        }
      } else {
        toast({
          title: 'Ошибка',
          description: response.error || 'Не удалось сгенерировать QR-код',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось сгенерировать QR-код',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Проверка статуса QR
   */
  const checkQrStatus = async () => {
    if (!qrState.token) return;

    setIsLoading(true);
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/qr-check', {
        token: qrState.token,
        password: qrState.password || undefined,
      });

      if (response.success && response.isAuthenticated) {
        toast({
          title: 'Авторизация успешна',
          description: 'Telegram Client API подключён',
        });
        resetQrState();
        onSuccess();
        onOpenChange(false);
      }
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось проверить QR',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Обновление QR-токена
   */
  const refreshQrToken = async () => {
    try {
      const response = await apiRequest('POST', '/api/telegram-auth/qr-refresh', {});
      if (response.success && response.token && response.qrUrl) {
        setQrState((prev) => ({
          ...prev,
          token: response.token,
          url: response.qrUrl,
          countdown: response.expires || 30,
        }));
      }
    } catch (error) {
      console.error('Ошибка обновления QR:', error);
    }
  };

  /**
   * Сброс состояния QR
   */
  const resetQrState = () => {
    setQrState({ token: '', url: '', password: '', countdown: 30 });
  };

  return {
    qrState,
    isLoading,
    generateQrCode,
    checkQrStatus,
    refreshQrToken,
    setQrPassword: (value: string) =>
      setQrState((prev) => ({ ...prev, password: value })),
    resetQrState,
  };
}
