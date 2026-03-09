/**
 * @fileoverview Процессор 2FA при проверке QR-токена
 * @module server/telegram/services/auth/qr-2fa-processor
 */

import { TelegramClient } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { is2FAError, requestQR2FAPassword } from './qr-2fa-request.js';
import { verifyQR2FAPassword } from './qr-2fa-verifier.js';
import { extractQRSessionAfter2FA } from './qr-session-extractor.js';
import { QR_TOKEN_EXPIRED, QR_CHECK_ERROR } from './qr-error-messages.js';

/**
 * Обрабатывает ошибку 2FA при проверке QR-токена
 *
 * @param error - Ошибка от Telegram API
 * @param client - Клиент Telegram
 * @param apiId - API ID приложения
 * @param apiHash - API Hash приложения
 * @param password - Пароль 2FA (если предоставлен)
 * @returns Результат проверки статуса QR
 */
export async function handleQRPasswordError(
  error: any,
  client: TelegramClient,
  apiId: string,
  apiHash: string,
  password?: string
): Promise<CheckQRStatusResult> {
  // Проверяем, ошибка ли это 2FA
  if (!is2FAError(error)) {
    return handleOtherQRErrors(error, client);
  }

  // Если пароль не передан — запрашиваем его
  if (!password) {
    return requestQR2FAPassword(client);
  }

  // Проверяем пароль
  const verification = await verifyQR2FAPassword(client, password);
  if (!verification.isSuccess) {
    return {
      success: false,
      error: verification.error,
      needsPassword: verification.needsPassword,
    };
  }

  // Извлекаем сессию после успешной проверки
  return extractQRSessionAfter2FA(client, apiId, apiHash);
}

/**
 * Обрабатывает прочие ошибки QR
 */
function handleOtherQRErrors(
  error: any,
  client: TelegramClient
): CheckQRStatusResult {
  // AUTH_TOKEN_EXPIRED — нормально для polling
  if (error.message?.includes('AUTH_TOKEN_EXPIRED')) {
    console.log(QR_TOKEN_EXPIRED);
    return {
      success: true,
      isAuthenticated: false,
      client,
    };
  }

  console.error(QR_CHECK_ERROR, error.message);
  return {
    success: false,
    error: error.message || 'Ошибка проверки QR',
    client,
  };
}
