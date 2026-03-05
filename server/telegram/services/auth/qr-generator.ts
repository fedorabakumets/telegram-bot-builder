/**
 * @fileoverview Генератор QR-кодов для авторизации Telegram
 * @module server/telegram/services/auth/qr-generator
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { GenerateQRResult } from '../../types/auth/generate-qr-result.js';
import type { GenerateQRTokenResult } from '../../types/auth/generate-qr-token-result.js';

/**
 * Генерирует QR-код для авторизации в Telegram
 *
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @returns Результат генерации с QR URL и токеном
 *
 * @example
 * ```typescript
 * const result = await generateQR('19827705', '52359acb...');
 * if (result.success) {
 *   console.log('QR URL:', result.qrUrl);
 * }
 * ```
 */
export async function generateQR(
  apiId: string,
  apiHash: string
): Promise<GenerateQRResult> {
  try {
    const client = new TelegramClient(
      new StringSession(''),
      parseInt(apiId),
      apiHash,
      {
        connectionRetries: 5,
        timeout: 30000,
      }
    );

    await client.connect();

    const result = await client.invoke(
      new Api.auth.ExportLoginToken({
        apiId: parseInt(apiId),
        apiHash,
        exceptIds: [],
      })
    );

    if (result instanceof Api.auth.LoginToken) {
      const tokenBase64 = Buffer.from(result.token).toString('base64url');
      const qrUrl = `tg://login?token=${tokenBase64}`;

      return {
        success: true,
        qrUrl,
        token: Buffer.from(result.token).toString('base64'),
      };
    }

    return {
      success: false,
      error: 'Неожиданный тип ответа от сервера',
    };
  } catch (error: any) {
    console.error('❌ Ошибка генерации QR:', error.message);
    return {
      success: false,
      error: error.message || 'Не удалось создать QR-код',
    };
  }
}

/**
 * Генерирует новый QR-токен с информацией о времени жизни
 *
 * @param client - Подключенный клиент Telegram
 * @param apiId - API ID приложения
 * @param apiHash - API Hash приложения
 * @returns Результат генерации с токеном и временем жизни
 *
 * @example
 * ```typescript
 * const result = await generateQRToken(client, '19827705', '52359acb...');
 * if (result.success) {
 *   console.log('Токен действителен:', result.expires, 'секунд');
 * }
 * ```
 */
export async function generateQRToken(
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

    if (result instanceof Api.auth.LoginToken) {
      const tokenBase64 = Buffer.from(result.token).toString('base64url');
      const qrUrl = `tg://login?token=${tokenBase64}`;
      const tokenPreview = Buffer.from(result.token).toString('base64').substring(0, 20) + '...';

      // expires — абсолютное время (Unix timestamp), конвертируем в секунды
      const now = Math.floor(Date.now() / 1000);
      const expiresInSeconds = result.expires - now;

      console.log(`✅ QR-токен сгенерирован (expires: ${expiresInSeconds}с, token: ${tokenPreview})`);

      return {
        success: true,
        token: Buffer.from(result.token).toString('base64'),
        qrUrl,
        expires: expiresInSeconds,
      };
    }

    // Если сразу вернулся MigrateTo — обрабатываем миграцию
    if (result instanceof Api.auth.LoginTokenMigrateTo) {
      console.log('🔄 QR: миграция на DC', result.dcId);

      // Мигрируем на нужный DC
      await client._switchDC(result.dcId);

      // Ждём немного после миграции
      await new Promise(resolve => setTimeout(resolve, 500));

      // Повторяем экспорт токена на новом DC
      console.log('🔄 Повторный экспорт токена после миграции...');
      return await generateQRToken(client, apiId, apiHash);
    }

    return {
      success: false,
      error: 'Неожиданный тип ответа',
    };
  } catch (error: any) {
    console.error('❌ Ошибка генерации QR-токена:', error.message);
    return {
      success: false,
      error: error.message || 'Ошибка генерации QR',
    };
  }
}
