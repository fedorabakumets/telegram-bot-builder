/**
 * @fileoverview Функция проверки статуса QR-кода
 *
 * @module checkQrStatus
 */

import { apiRequest } from '@/lib/queryClient';

/**
 * Параметры для проверки статуса QR
 */
export interface CheckQrStatusParams {
  /** Токен QR-кода */
  token: string;
  /** Пароль 2FA (опционально) */
  password?: string;
  /** Установить статус загрузки */
  setIsLoading: (value: boolean) => void;
  /** Функция toast для уведомлений */
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void;
  /** Коллбэк успешной авторизации */
  onSuccess: () => void;
  /** Управление состоянием диалога */
  onOpenChange: (open: boolean) => void;
  /** Сброс состояния QR */
  resetQrState: () => void;
}

/**
 * Результат проверки статуса QR
 */
export interface CheckQrStatusResult {
  /** Успешно ли выполнение */
  success: boolean;
  /** Авторизован ли пользователь */
  isAuthenticated?: boolean;
}

/**
 * Проверяет статус QR-кода
 *
 * @param params - Параметры проверки
 * @returns {Promise<CheckQrStatusResult>} Результат операции
 */
export async function checkQrStatus(
  params: CheckQrStatusParams
): Promise<CheckQrStatusResult> {
  const {
    token,
    password,
    setIsLoading,
    toast,
    onSuccess,
    onOpenChange,
    resetQrState,
  } = params;

  if (!token) return { success: false };

  setIsLoading(true);
  try {
    const response = await apiRequest('POST', '/api/telegram-auth/qr-check', {
      token,
      password: password || undefined,
    });

    if (response.success && response.isAuthenticated) {
      toast({
        title: 'Авторизация успешна',
        description: 'Telegram Client API подключён',
      });
      resetQrState();
      onSuccess();
      onOpenChange(false);
      return { success: true, isAuthenticated: true };
    }

    return { success: response.success };
  } catch (error: any) {
    toast({
      title: 'Ошибка',
      description: error.message || 'Не удалось проверить QR',
      variant: 'destructive',
    });
    return { success: false };
  } finally {
    setIsLoading(false);
  }
}
