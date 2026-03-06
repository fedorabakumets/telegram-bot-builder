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
  console.log('🔧 Создание QR-клиента с параметрами:', {
    apiId,
    apiHash: apiHash.substring(0, 10) + '...',
    deviceModel: DEVICE_CONFIG.deviceModel,
    systemVersion: DEVICE_CONFIG.systemVersion,
    appVersion: DEVICE_CONFIG.appVersion,
  });

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

  console.log('📡 Подключение к Telegram...');
  await client.connect();

  // Вызываем invoke сразу после подключения, чтобы gramJS отправил InitConnection
  // с нашими параметрами устройства (appVersion, deviceModel, systemVersion)
  console.log('🔑 Инициализация соединения через invoke (GetConfig)...');
  try {
    await client.invoke(new Api.help.GetConfig());
    console.log('✅ Соединение инициализировано с параметрами:', {
      deviceModel: DEVICE_CONFIG.deviceModel,
      systemVersion: DEVICE_CONFIG.systemVersion,
      appVersion: DEVICE_CONFIG.appVersion,
    });
  } catch (error: any) {
    console.error('⚠️ Ошибка инициализации:', error.message);
  }

  return client;
}
