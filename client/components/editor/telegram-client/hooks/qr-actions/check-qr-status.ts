/**
 * @fileoverview Функция проверки статуса QR-кода
 *
 * @module checkQrStatus
 */

import { useToast } from '@/hooks/use-toast';
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
 *
 * @example
 * ```tsx
 * const result = await checkQrStatus({
 *   token: qrState.token,
 *   password: qrState.password,
 *   setIsLoading,
 *   onSuccess,
 *   onOpenChange,
 *   resetQrState
 * });
 * ```
 */
export async function checkQrStatus(
  params: CheckQrStatusParams
): Promise<CheckQrStatusResult> {
  const {
    token,
    password,
    setIsLoading,
    onSuccess,
    onOpenChange,
    resetQrState,
  } = params;
  const { toast } = useToast();

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
