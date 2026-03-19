/**
 * @fileoverview Функция обновления QR-токена
 *
 * @module refreshQrToken
 */

import type { QrState } from '../../types';
import type { NotificationService } from '../../services';
import { createTelegramAuthService } from '../../services/telegram-auth-service';
import { createLogger } from '../../services/logger-service';
import { QR_TOKEN_EXPIRY } from '../../constants';

const logger = createLogger({ prefix: '[TelegramAuth]' });

/**
 * Параметры для обновления QR-токена
 */
export interface RefreshQrTokenParams {
  /** Установить состояние QR */
  setQrState: (updater: (prev: QrState) => QrState) => void;
  /** Установить статус загрузки */
  setIsLoading?: (value: boolean) => void;
  /** Сервис уведомлений */
  notifications?: NotificationService;
}

/**
 * Результат обновления QR-токена
 */
export interface RefreshQrTokenResult {
  /** Успешно ли выполнение */
  success: boolean;
  /** Сообщение о результате */
  message?: string;
}

/**
 * Обновляет QR-токен
 *
 * @param params - Параметры обновления
 * @returns {Promise<RefreshQrTokenResult>} Результат операции
 *
 * @example
 * ```tsx
 * const result = await refreshQrToken({ setQrState, setIsLoading, notifications });
 * ```
 */
export async function refreshQrToken(
  params: RefreshQrTokenParams
): Promise<RefreshQrTokenResult> {
  const { setQrState, setIsLoading, notifications } = params;
  const authService = createTelegramAuthService();

  setIsLoading?.(true);
  try {
    const response = await authService.refreshQr();

    if (response.success && response.token && response.qrUrl) {
      setQrState((prev) => ({
        ...prev,
        token: response.token!,
        url: response.qrUrl!,
        countdown: response.expires ?? QR_TOKEN_EXPIRY,
      }));

      notifications?.success('QR-код обновлён', 'Токен действителен 30 секунд');
      return { success: true, message: 'QR-код обновлён' };
    }

    const errorMessage = response.error || 'Не удалось обновить QR-код';
    notifications?.error('Ошибка', errorMessage);
    logger.warn('Обновление QR не удалось', response);
    return { success: false, message: errorMessage };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Ошибка сети';
    notifications?.error('Ошибка', message);
    logger.error('Ошибка обновления QR', error);
    return { success: false, message };
  } finally {
    setIsLoading?.(false);
  }
}
