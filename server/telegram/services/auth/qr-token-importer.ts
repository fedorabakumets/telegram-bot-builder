/**
 * @fileoverview Импорт и базовая проверка QR-токена
 * @module server/telegram/services/auth/qr-token-importer
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import type { CheckQRStatusResult } from '../../types/auth/check-qr-status-result.js';
import { formatTokenCheckMessage, formatScanSuccessMessage } from './qr-token-formatter.js';
import { validateTokenImportResult } from './qr-token-validator.js';

/**
 * Импортирует QR-токен и проверяет его статус
 *
 * @param client - Клиент Telegram
 * @param token - Токен QR-кода в base64
 * @returns Результат проверки статуса
 */
export async function importQRToken(
  client: TelegramClient,
  token: string
): Promise<CheckQRStatusResult> {
  console.log(formatTokenCheckMessage(token));

  const result = await client.invoke(
    new Api.auth.ImportLoginToken({
      token: Buffer.from(token, 'base64'),
    })
  );

  const validation = validateTokenImportResult(result);

  // QR ещё не отсканирован
  if (validation.isPending) {
    return {
      success: true,
      isAuthenticated: false,
      client,
    };
  }

  // QR отсканирован успешно
  if (validation.isSuccess === true) {
    // Вызываем getMe() для активации сессии в Telegram
    // Это необходимо для того, чтобы устройство появилось в списке сессий
    try {
      console.log('🔍 Активация сессии через getMe...');
      const user = await client.getMe();
      console.log('✅ Сессия активирована, пользователь:', user.firstName || user.username || `ID:${user.id}`);
    } catch (error: any) {
      console.error('⚠️ Ошибка при getMe после импорта токена:', error.message);
      // Не прерываем процесс, если getMe не удался
    }

    const sessionString = String(client.session.save() ?? '');
    console.log(formatScanSuccessMessage(sessionString));

    return {
      success: true,
      isAuthenticated: true,
      sessionString,
    };
  }

  // Неизвестный статус
  return {
    success: false,
    error: 'Неизвестный статус QR',
  };
}
