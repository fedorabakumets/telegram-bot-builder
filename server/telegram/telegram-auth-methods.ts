/**
 * @fileoverview Методы авторизации Telegram Client API
 *
 * Предоставляет дополнительные способы авторизации:
 * - QR-код авторизация (через сканирование в приложении)
 * - Повторная отправка кода
 *
 * @module telegram-auth-methods
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';

/**
 * Результат авторизации через QR-код
 */
export interface QRAuthResult {
  /** Успешность операции */
  success: boolean;
  /** URL QR-кода для сканирования */
  qrUrl?: string;
  /** Токен авторизации */
  token?: string;
  /** Хеш телефона */
  phoneCodeHash?: string;
  /** Сообщение об ошибке */
  error?: string;
}

/**
 * Создает QR-код для авторизации в Telegram
 *
 * @param {TelegramClient} client - Клиент Telegram
 * @param {string} apiId - API ID из настроек
 * @param {string} apiHash - API Hash из настроек
 * @returns {Promise<QRAuthResult>} Результат авторизации через QR-код
 *
 * @example
 * ```typescript
 * const result = await createQRAuth(client, apiId, apiHash);
 * if (result.success) {
 *   console.log('Отсканируйте QR-код:', result.qrUrl);
 * }
 * ```
 */
export async function createQRAuth(client: TelegramClient, apiId: string, apiHash: string): Promise<QRAuthResult> {
  try {
    // Метод: auth.exportLoginToken с правильными параметрами
    const result = await client.invoke(new Api.auth.ExportLoginToken({
      apiId: parseInt(apiId),
      apiHash: apiHash,
      exceptIds: []
    }));

    if (result instanceof Api.auth.LoginToken) {
      // Кодируем токен в base64url для Telegram
      const tokenBase64 = Buffer.from(result.token).toString('base64url');
      const qrUrl = `tg://login?token=${tokenBase64}`;

      return {
        success: true,
        qrUrl,
        token: Buffer.from(result.token).toString('base64')
      };
    }

    return {
      success: false,
      error: 'Не удалось создать QR-код: неожиданный тип ответа'
    };
  } catch (error: any) {
    console.error('Ошибка создания QR-кода:', error?.message);
    return {
      success: false,
      error: error.message || 'Ошибка при создании QR-кода'
    };
  }
}
