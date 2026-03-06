/**
 * @fileoverview Менеджер клиентов для QR-авторизации
 * @module server/telegram/services/auth/qr-client-manager
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import {
  QR_CREATING_CLIENT,
  QR_REUSING_CLIENT
} from './qr-error-messages.js';

/**
 * Параметры для создания QR клиента
 */
export interface QRClientConfig {
  /** API ID приложения Telegram */
  apiId: string;
  /** API Hash приложения Telegram */
  apiHash: string;
}

/**
 * Создаёт нового клиента Telegram для QR-авторизации или переиспользует существующего
 *
 * @param existingClient - Существующий клиент для переиспользования
 * @param config - Конфигурация для создания нового клиента
 * @returns Клиент Telegram для QR-авторизации
 */
export async function getOrCreateQRClient(
  existingClient: TelegramClient | undefined,
  config: QRClientConfig
): Promise<TelegramClient> {
  if (existingClient) {
    console.log(QR_REUSING_CLIENT);
    return existingClient;
  }

  console.log(QR_CREATING_CLIENT);

  const client = new TelegramClient(
    new StringSession(''),
    parseInt(config.apiId),
    config.apiHash,
    {
      connectionRetries: 5,
      timeout: 30000,
      useWSS: false,
      autoReconnect: false,
      // Указываем информацию об устройстве для корректного отображения в Telegram
      appVersion: '1.0.0',
      deviceModel: 'Server Bot Builder',
      systemVersion: process.platform === 'win32' ? 'Windows_NT' : process.platform,
    }
  );

  await client.connect();
  return client;
}
