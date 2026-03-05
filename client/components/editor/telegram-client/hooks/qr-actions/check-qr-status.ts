/**
 * @fileoverview Функция проверки статуса QR-кода
 *
 * @module checkQrStatus
 */

import type { NotificationService } from '../../services';
import { createTelegramAuthService } from '../../services/telegram-auth-service';

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
  /** Сервис уведомлений */
  notifications: NotificationService;
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
    notifications,
    onSuccess,
    onOpenChange,
    resetQrState,
  } = params;
  const authService = createTelegramAuthService();

  if (!token) return { success: false };

  setIsLoading(true);
  try {
    const response = await authService.checkQr(token, password);

    if (response.success && response.isAuthenticated) {
      notifications.success('Авторизация успешна', 'Telegram Client API подключён');
      resetQrState();
      onSuccess();
      onOpenChange(false);
      return { success: true, isAuthenticated: true };
    }

    return { success: response.success };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Не удалось проверить QR';
    notifications.error('Ошибка', message);
    return { success: false };
  } finally {
    setIsLoading(false);
  }
}
