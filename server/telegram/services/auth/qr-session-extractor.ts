/**
 * @fileoverview Извлечение сессии после успешной 2FA проверки
 * @module server/telegram/services/auth/qr-session-extractor
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import {
  QR_SCANNED_WITH_2FA,
  QR_SESSION_STRING,
  QR_NOT_SCANNED_AFTER_2FA,
  QR_2FA_VERIFIED
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
  try {
    // Проверяем, авторизован ли клиент (получаем информацию о пользователе)
    const user = await client.invoke(new Api.users.GetUsers({ id: [] }));
    
    if (user && user.length > 0) {
      // Клиент авторизован, извлекаем сессию
      const sessionString = client.session.save();
      console.log(`${QR_SCANNED_WITH_2FA}`);
      console.log(`${QR_SESSION_STRING} ${sessionString}`);
      console.log(`${QR_2FA_VERIFIED} для пользователя ${user[0].firstName || 'unknown'}`);

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
    console.error('❌ Ошибка извлечения сессии после 2FA:', error.message);
    return {
      success: false,
      error: error.message || 'Ошибка извлечения сессии',
      client,
    };
  }
}
