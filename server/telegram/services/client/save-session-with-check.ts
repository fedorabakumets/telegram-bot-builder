/**
 * @fileoverview Сохранение сессии с проверкой клиента
 * @module server/telegram/services/client/save-session-with-check
 */

import { TelegramClient } from 'telegram';
import { saveSession } from './save-session.js';

/**
 * Сохраняет сессию клиента с проверкой его наличия
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @returns Строка сессии или null
 */
export function saveSessionWithCheck(
  userId: string,
  client: TelegramClient | null
): string | null {
  if (!client) {
    return null;
  }
  return saveSession(client);
}
