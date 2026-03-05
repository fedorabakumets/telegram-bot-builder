/**
 * @fileoverview Запрос 2FA пароля при проверке QR
 * @module server/telegram/services/auth/qr-2fa-request
 */

import type { TelegramClient } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { QR_REQUIRES_2FA } from './qr-error-messages.js';

/**
 * Обрабатывает запрос 2FA пароля при проверке QR-токена
 *
 * @param client - Клиент Telegram
 * @returns Результат с запросом пароля
 */
export function requestQR2FAPassword(
  client: TelegramClient
): CheckQRStatusResult {
  console.log(QR_REQUIRES_2FA);

  return {
    success: true,
    isAuthenticated: false,
    needsPassword: true,
    client,
  };
}

/**
 * Проверяет, требует ли ошибка 2FA аутентификации
 *
 * @param error - Ошибка от Telegram API
 * @returns true, если требуется 2FA
 */
export function is2FAError(error: any): boolean {
  return error.message?.includes('SESSION_PASSWORD_NEEDED');
}
