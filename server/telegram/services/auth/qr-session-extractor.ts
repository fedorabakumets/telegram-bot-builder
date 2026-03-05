/**
 * @fileoverview Извлечение сессии после успешной 2FA проверки
 * @module server/telegram/services/auth/qr-session-extractor
 */

import { TelegramClient } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import type { GenerateQRTokenResult } from '../../types/auth/generate-qr-token-result.js';
import { generateQRTokenWithExpiry } from './qr-token-generator.js';
import {
  QR_SCANNED_WITH_2FA,
  QR_SESSION_STRING,
  QR_NOT_SCANNED_AFTER_2FA
} from './qr-error-messages.js';

/**
 * Извлекает сессию после успешной 2FA проверки
 *
 * @param client - Клиент Telegram
 * @param apiId - API ID приложения
 * @param apiHash - API Hash приложения
 * @returns Результат с сессией или статусом ожидания
 */
export async function extractQRSessionAfter2FA(
  client: TelegramClient,
  apiId: string,
  apiHash: string
): Promise<CheckQRStatusResult> {
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
}
