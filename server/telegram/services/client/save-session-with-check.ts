/**
 * @fileoverview Сохранение сессии с проверкой клиента
 * @module server/telegram/services/client/save-session-with-check
 */

import type { TelegramClient } from 'telegram';
import { saveSession } from './save-session.js';

/**
 * Сохраняет сессию клиента с проверкой его наличия
 * @param client - Клиент Telegram
 * @returns Строка сессии или null
 */
export function saveSessionWithCheck(
  client: TelegramClient | null
): Promise<string | null> {
  if (!client) {
    return Promise.resolve(null);
  }
  return saveSession(client);
}
