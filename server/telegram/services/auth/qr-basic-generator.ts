/**
 * @fileoverview Генерация базового QR-кода для авторизации Telegram
 * @module server/telegram/services/auth/qr-basic-generator
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { GenerateQRResult } from '../../types/auth/generate-qr-result.js';

/**
 * Генерирует QR-код для авторизации в Telegram
 *
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @returns Результат генерации с QR URL и токеном
 */
export async function generateBasicQR(
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
    console.error('Ошибка генерации QR:', error.message);
    return {
      success: false,
      error: error.message || 'Не удалось создать QR-код',
    };
  }
}
