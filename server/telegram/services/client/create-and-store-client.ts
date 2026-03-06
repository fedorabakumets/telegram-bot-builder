/**
 * @fileoverview Создание клиента с сохранением в Map
 * @module server/telegram/services/client/create-and-store-client
 * @description Создаёт клиента Telegram для QR авторизации и сохраняет в Map
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';

/**
 * Создаёт клиента Telegram и сохраняет его в Map
 * @param userId - ID пользователя
 * @param config - Конфигурация клиента
 * @param clients - Map клиентов для сохранения
 * @returns Созданный клиент
 */
export async function createAndStoreClient(
  userId: string,
  config: TelegramClientConfig,
  clients: Map<string, TelegramClient>
): Promise<TelegramClient> {
  const { apiId, apiHash } = config;

  const client = new TelegramClient(
    new StringSession(''),
    parseInt(apiId),
    apiHash,
    {
      connectionRetries: 5,
      timeout: 30000,
      useWSS: false,
      autoReconnect: false,
    }
  );

  await client.connect();
  clients.set(userId, client);

  return client;
}
