/**
 * @fileoverview Отключение клиента с проверкой
 * @module server/telegram/services/client/disconnect-with-check
 */

import { TelegramClient } from 'telegram';
import { disconnectClient } from './disconnect-client.js';

/**
 * Отключает клиента с проверкой его наличия
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param clients - Map клиентов
 * @param sessions - Map сессий
 * @param authStatus - Map статусов
 */
export async function disconnectWithCheck(
  userId: string,
  client: TelegramClient | undefined,
  clients: Map<string, TelegramClient>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<void> {
  if (!client) {
    return;
  }
  await disconnectClient(userId, client, clients, sessions, authStatus);
}
