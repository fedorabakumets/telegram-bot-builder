/**
 * @fileoverview Функция обновления QR-токена
 *
 * @module refreshQrToken
 */

import type { QrState } from '../../types';
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
}

/**
 * Результат обновления QR-токена
 */
export interface RefreshQrTokenResult {
  /** Успешно ли выполнение */
  success: boolean;
  /** Новый токен */
  token?: string;
  /** Новый URL */
  url?: string;
  /** Время действия */
  expires?: number;
}

/**
 * Обновляет QR-токен
 *
 * @param params - Параметры обновления
 * @returns {Promise<RefreshQrTokenResult>} Результат операции
 *
 * @example
 * ```tsx
 * const result = await refreshQrToken({ setQrState });
 * ```
 */
export async function refreshQrToken(
  params: RefreshQrTokenParams
): Promise<RefreshQrTokenResult> {
  const { setQrState } = params;
  const authService = createTelegramAuthService();

  try {
    const response = await authService.refreshQr();

    if (response.success && response.token && response.qrUrl) {
      setQrState((prev) => ({
        ...prev,
        token: response.token,
        url: response.qrUrl,
        countdown: response.expires ?? QR_TOKEN_EXPIRY,
      }));

      return {
        success: true,
        token: response.token,
        url: response.qrUrl,
        expires: response.expires,
      };
    }

    return { success: false };
  } catch (error) {
    logger.error('Ошибка обновления QR', error);
    return { success: false };
  }
}
