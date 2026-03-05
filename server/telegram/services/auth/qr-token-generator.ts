/**
 * @fileoverview Генерация QR-токена с информацией о времени жизни
 * @module server/telegram/services/auth/qr-token-generator
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import type { GenerateQRTokenResult } from '../../types/auth/generate-qr-token-result.js';
import {
  QR_GENERATED_SUCCESS,
  QR_GENERATION_ERROR,
  QR_REEXPORTING_TOKEN
} from './qr-error-messages.js';
import { checkMigrationNeeded, handleQRMigration } from './qr-migration-handler.js';

/**
 * Генерирует QR-токен с информацией о времени жизни токена
 *
 * @param client - Подключенный клиент Telegram
 * @param apiId - API ID приложения
 * @param apiHash - API Hash приложения
 * @returns Результат с токеном, QR URL и временем жизни
 */
export async function generateQRTokenWithExpiry(
  client: TelegramClient,
  apiId: string,
  apiHash: string
): Promise<GenerateQRTokenResult> {
  try {
    const result = await client.invoke(
      new Api.auth.ExportLoginToken({
        apiId: parseInt(apiId),
        apiHash,
        exceptIds: [],
      })
    );

    // Обрабатываем миграцию на другой DC
    const migration = checkMigrationNeeded(result);
    if (migration.needsMigration && migration.dcId) {
      const migrated = await handleQRMigration(
        client,
        migration.dcId,
        apiId,
        apiHash
      );

      return {
        success: true,
        token: migrated.token,
        qrUrl: migrated.qrUrl,
        expires: migrated.expires,
      };
    }

    // Базовый токен
    if (result instanceof Api.auth.LoginToken) {
      return formatQRTokenResult(result);
    }

    return {
      success: false,
      error: 'Неожиданный тип ответа',
    };
  } catch (error: any) {
    console.error(QR_GENERATION_ERROR, error.message);
    return {
      success: false,
      error: error.message || 'Ошибка генерации QR',
    };
  }
}

/**
 * Форматирует результат генерации QR-токена
 *
 * @param result - Результат от Telegram API
 * @returns Отформатированный результат
 */
function formatQRTokenResult(result: Api.auth.LoginToken): GenerateQRTokenResult {
  const tokenBase64 = Buffer.from(result.token).toString('base64url');
  const qrUrl = `tg://login?token=${tokenBase64}`;
  const tokenPreview = Buffer.from(result.token).toString('base64').substring(0, 20) + '...';

  // expires — абсолютное время (Unix timestamp), конвертируем в секунды
  const now = Math.floor(Date.now() / 1000);
  const expiresInSeconds = result.expires - now;

  console.log(`${QR_GENERATED_SUCCESS} (expires: ${expiresInSeconds}с, token: ${tokenPreview})`);

  return {
    success: true,
    token: Buffer.from(result.token).toString('base64'),
    qrUrl,
    expires: expiresInSeconds,
  };
}
