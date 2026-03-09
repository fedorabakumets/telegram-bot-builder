/**
 * @fileoverview Получение клиента из Map
 * @module server/telegram/services/client/get-client
 */

import { TelegramClient } from 'telegram';

/**
 * Получает клиента Telegram из Map по ID пользователя
 * @param userId - ID пользователя
 * @param clients - Map клиентов
 * @returns Клиент или null
 */
export function getClient(
  userId: string,
  clients: Map<string, TelegramClient>
): TelegramClient | null {
  return clients.get(userId) || null;
}
