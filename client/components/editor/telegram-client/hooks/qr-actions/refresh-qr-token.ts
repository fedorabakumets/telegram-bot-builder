/**
 * @fileoverview Функция обновления QR-токена
 *
 * @module refreshQrToken
 */

import { apiRequest } from '@/lib/queryClient';
import type { QrState } from '../types';

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

  try {
    const response = await apiRequest('POST', '/api/telegram-auth/qr-refresh', {});

    if (response.success && response.token && response.qrUrl) {
      setQrState((prev) => ({
        ...prev,
        token: response.token,
        url: response.qrUrl,
        countdown: response.expires || 30,
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
    console.error('Ошибка обновления QR:', error);
    return { success: false };
  }
}
