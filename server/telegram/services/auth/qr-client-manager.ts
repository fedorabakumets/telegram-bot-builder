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
import { createQRClient } from './create-qr-client.js';

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

  const client = createQRClient(config.apiId, config.apiHash);
  await client.connect();
  return client;
}
