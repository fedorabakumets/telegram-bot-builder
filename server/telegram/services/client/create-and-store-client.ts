/**
 * @fileoverview Создание клиента с сохранением в Map
 * @module server/telegram/services/client/create-and-store-client
 * @description Создаёт клиента Telegram для QR авторизации и сохраняет в Map
 */

import { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import { createQRClient } from '../auth/create-qr-client.js';

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

  const client = await createQRClient(apiId, apiHash);
  clients.set(userId, client);

  return client;
}
