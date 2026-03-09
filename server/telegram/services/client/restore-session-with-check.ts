/**
 * @fileoverview Восстановление сессии с проверкой
 * @module server/telegram/services/client/restore-session-with-check
 */

import { TelegramClient } from 'telegram';
import { restoreSession } from './restore-session.js';

/**
 * Восстанавливает сессию пользователя
 * @param userId - ID пользователя
 * @param clients - Map клиентов
 * @param sessions - Map сессий
 * @param authStatus - Map статусов
 * @returns Успешность восстановления
 */
export async function restoreSessionWithCheck(
  userId: string,
  clients: Map<string, TelegramClient>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<boolean> {
  return restoreSession(userId, clients, sessions, authStatus);
}
