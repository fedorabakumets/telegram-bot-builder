/**
 * @fileoverview Отключение клиента и очистка данных
 * @module server/telegram/services/client/disconnect-client
 */

import { TelegramClient } from 'telegram';
import { disconnectTelegramClient } from './disconnect-telegram-client.js';

/**
 * Отключает клиента и очищает данные из хранилищ
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param clients - Map клиентов
 * @param sessions - Map сессий
 * @param authStatus - Map статусов авторизации
 */
export async function disconnectClient(
  userId: string,
  client: TelegramClient,
  clients: Map<string, TelegramClient>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<void> {
  try {
    await disconnectTelegramClient(client);
    clients.delete(userId);
    sessions.delete(userId);
    authStatus.delete(userId);
    console.log(`✅ Клиент отключен для пользователя ${userId}`);
  } catch (error) {
    console.error('Error disconnecting client:', error);
  }
}
