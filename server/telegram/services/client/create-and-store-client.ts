/**
 * @fileoverview Создание клиента с сохранением в Map
 * @module server/telegram/services/client/create-and-store-client
 */

import { TelegramClient } from 'telegram';
import { startClientWithPhone } from './start-client-with-phone.js';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';

/**
 * Создаёт клиента и сохраняет его в Map
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
  const client = await startClientWithPhone(config);
  clients.set(userId, client);
  return client;
}
