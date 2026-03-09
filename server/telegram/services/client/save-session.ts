/**
 * @fileoverview Сохранение сессии клиента
 * @module server/telegram/services/client/save-session
 */

import { TelegramClient } from 'telegram';

/**
 * Сохраняет сессию клиента в строку
 * @param client - Клиент Telegram
 * @returns Строка сессии или null
 */
export async function saveSession(client: TelegramClient): Promise<string | null> {
  if (client && client.session) {
    const sessionData = client.session.save();
    return typeof sessionData === 'string' ? sessionData : String(sessionData);
  }
  return null;
}
