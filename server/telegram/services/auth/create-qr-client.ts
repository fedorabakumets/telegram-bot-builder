/**
 * @fileoverview Создание клиента Telegram для QR-авторизации
 * @module server/telegram/services/auth/create-qr-client
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

/**
 * Параметры устройства по умолчанию
 */
const DEVICE_CONFIG = {
  appVersion: '1.0.0',
  deviceModel: 'Server Bot Builder',
  systemVersion: typeof process !== 'undefined' && process.platform
    ? (process.platform === 'win32' ? 'Windows_NT' : process.platform)
    : 'Unknown',
};

/**
 * Создаёт клиента Telegram для QR-авторизации с правильными параметрами устройства
 *
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @returns Подключенный клиент Telegram
 *
 * @example
 * ```typescript
 * const client = createQRClient('123456', 'abcdef123456');
 * await client.connect();
 * ```
 */
export async function createQRClient(apiId: string, apiHash: string): Promise<TelegramClient> {
  const client = new TelegramClient(
    new StringSession(''),
    parseInt(apiId),
    apiHash,
    {
      connectionRetries: 5,
      timeout: 30000,
      useWSS: false,
      autoReconnect: false,
      // Параметры устройства для корректного отображения в Telegram
      appVersion: DEVICE_CONFIG.appVersion,
      deviceModel: DEVICE_CONFIG.deviceModel,
      systemVersion: DEVICE_CONFIG.systemVersion,
      langCode: 'ru',
      systemLangCode: 'ru',
    }
  );

  await client.connect();

  console.log('✅ QR-клиент создан с параметрами:', {
    deviceModel: DEVICE_CONFIG.deviceModel,
    systemVersion: DEVICE_CONFIG.systemVersion,
    appVersion: DEVICE_CONFIG.appVersion,
  });

  return client;
}
