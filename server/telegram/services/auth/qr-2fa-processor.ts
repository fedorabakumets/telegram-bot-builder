/**
 * @fileoverview Процессор 2FA при проверке QR-токена
 * @module server/telegram/services/auth/qr-2fa-processor
 */

import { TelegramClient } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { verifyPassword } from './2fa-service.js';
import { generateQRTokenWithExpiry } from './qr-token-generator.js';
import {
  QR_REQUIRES_2FA,
  QR_CHECKING_2FA,
  QR_2FA_VERIFIED,
  QR_SCANNED_WITH_2FA,
  QR_SESSION_STRING,
  QR_NOT_SCANNED_AFTER_2FA,
  QR_2FA_ERROR
} from './qr-error-messages.js';

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
  if (!error.message?.includes('SESSION_PASSWORD_NEEDED')) {
    return handleOtherQRErrors(error, client);
  }

  console.log(QR_REQUIRES_2FA);

  // Если пароль не передан — запрашиваем его
  if (!password) {
    return {
      success: true,
      isAuthenticated: false,
      needsPassword: true,
      client,
    };
  }

  return await processQR2FA(client, apiId, apiHash, password);
}

/**
 * Обрабатывает 2FA аутентификацию при проверке QR
 */
async function processQR2FA(
  client: TelegramClient,
  apiId: string,
  apiHash: string,
  password: string
): Promise<CheckQRStatusResult> {
  try {
    console.log(QR_CHECKING_2FA);

    // Проверяем пароль через 2FA сервис
    const passwordResult = await verifyPassword(client, password);
    if (!passwordResult.success) {
      return {
        success: false,
        error: passwordResult.error,
        needsPassword: true,
      };
    }

    console.log(QR_2FA_VERIFIED);

    // После успешной проверки — получаем сессию
    const tokenResult = await generateQRTokenWithExpiry(client, apiId, apiHash);

    if (tokenResult.success && tokenResult.token) {
      const sessionString = client.session.save();
      console.log(`${QR_SCANNED_WITH_2FA}`);
      console.log(`${QR_SESSION_STRING} ${sessionString}`);

      return {
        success: true,
        isAuthenticated: true,
        sessionString: String(sessionString),
        client,
      };
    }

    console.log(QR_NOT_SCANNED_AFTER_2FA);
    return {
      success: true,
      isAuthenticated: false,
      client,
    };
  } catch (error: any) {
    return handle2FAError(error);
  }
}

/**
 * Обрабатывает ошибки 2FA
 */
function handle2FAError(error: any): CheckQRStatusResult {
  if (error.message?.includes('PASSWORD_HASH_INVALID')) {
    return {
      success: false,
      error: 'Неверный пароль 2FA',
      needsPassword: true,
    };
  }

  console.error(QR_2FA_ERROR, error.message);
  return {
    success: false,
    error: error.message || 'Ошибка проверки 2FA',
  };
}

/**
 * Обрабатывает прочие ошибки QR
 */
function handleOtherQRErrors(error: any, client: TelegramClient): CheckQRStatusResult {
  // AUTH_TOKEN_EXPIRED — нормально для polling
  if (error.message?.includes('AUTH_TOKEN_EXPIRED')) {
    console.log('Токен уже был проверен — это нормально для polling');
    return {
      success: true,
      isAuthenticated: false,
      client,
    };
  }

  console.error('Ошибка проверки QR:', error.message);
  return {
    success: false,
    error: error.message || 'Ошибка проверки QR',
    client,
  };
}
