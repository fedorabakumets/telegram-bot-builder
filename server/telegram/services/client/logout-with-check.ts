/**
 * @fileoverview Выход пользователя с проверкой
 * @module server/telegram/services/client/logout-with-check
 */

import { TelegramClient } from 'telegram';
import { logoutUser } from './logout-user.js';

/**
 * Выполняет выход с проверкой наличия клиента
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param clients - Map клиентов
 * @param sessions - Map сессий
 * @param authStatus - Map статусов
 * @returns Результат выхода
 */
export async function logoutWithCheck(
  userId: string,
  client: TelegramClient | undefined,
  clients: Map<string, TelegramClient>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'Клиент не найден' };
  }

  return logoutUser(userId, client, clients, sessions, authStatus);
}
