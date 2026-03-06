/**
 * @fileoverview Создание клиента Telegram для QR-авторизации
 * @module server/telegram/services/auth/create-qr-client
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { Api } from 'telegram';

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
    }
  );

  await client.connect();

  // Устанавливаем параметры устройства явно через API
  try {
    await client.invoke(
      new Api.InvokeWithLayer({
        layer: 198,
        query: {
          _: 'initConnection',
          apiId: parseInt(apiId),
          deviceModel: DEVICE_CONFIG.deviceModel,
          systemVersion: DEVICE_CONFIG.systemVersion,
          appVersion: DEVICE_CONFIG.appVersion,
          langCode: 'ru',
          query: {
            _: 'help.getConfig',
          },
        },
      })
    );
    console.log('✅ Параметры устройства установлены:', DEVICE_CONFIG);
  } catch (error: any) {
    console.error('⚠️ Не удалось установить параметры устройства:', error.message);
  }

  return client;
}
