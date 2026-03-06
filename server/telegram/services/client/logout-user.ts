/**
 * @fileoverview Выход пользователя с очисткой данных
 * @module server/telegram/services/client/logout-user
 */

import { TelegramClient } from 'telegram';
import { logout } from './logout.js';

/**
 * Выполняет выход пользователя с очисткой всех данных
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param clients - Map клиентов для очистки
 * @param sessions - Map сессий для очистки
 * @param authStatus - Map статусов для очистки
 * @returns Результат выхода
 */
export async function logoutUser(
  userId: string,
  client: TelegramClient,
  clients: Map<string, TelegramClient>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<{ success: boolean; error?: string }> {
  const result = await logout(client);

  if (result.success) {
    clients.delete(userId);
    sessions.delete(userId);
    authStatus.delete(userId);
    console.log(`✅ Пользователь ${userId} вышел из Client API`);
  }

  return result;
}
