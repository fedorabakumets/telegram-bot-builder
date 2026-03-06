/**
 * @fileoverview Восстановление сессии пользователя
 * @module server/telegram/services/client/restore-session
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { createTelegramClient } from './create-telegram-client.js';
import { disableUpdateLoop } from './disable-update-loop.js';
import { validateSession } from './validate-session.js';
import { loadSessionFromDb } from './load-session-from-db.js';
import { loadApiCredentials } from './load-api-credentials.js';
import { getEnvCredentials } from './get-env-credentials.js';

/**
 * Восстанавливает сессию пользователя из базы данных
 * @param userId - ID пользователя
 * @param clients - Map для хранения клиентов
 * @param sessions - Map для хранения сессий
 * @param authStatus - Map для хранения статусов авторизации
 * @returns Успешность восстановления
 */
export async function restoreSession(
  userId: string,
  clients: Map<string, TelegramClient>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<boolean> {
  try {
    const sessionString = await loadSessionFromDb(userId);
    if (!sessionString) {
      return false;
    }

    let credentials = getEnvCredentials();
    if (!credentials) {
      credentials = await loadApiCredentials(userId);
    }

    if (!credentials) {
      console.log(`❌ API credentials не найдены для пользователя ${userId}`);
      return false;
    }

    const client = createTelegramClient({
      apiId: credentials.apiId,
      apiHash: credentials.apiHash,
      session: sessionString,
    });

    await client.connect();
    disableUpdateLoop(client);

    const userData = await validateSession(client);
    if (userData) {
      clients.set(userId, client);
      sessions.set(userId, sessionString);
      authStatus.set(userId, {
        isAuthenticated: true,
        phoneNumber: userData.phoneNumber,
        userId,
        needsCode: false,
        needsPassword: false,
      });
      console.log(`✅ Сессия восстановлена для пользователя ${userId}`);
      return true;
    }
    return false;
  } catch (error: any) {
    console.error('Detailed error:', error?.message, error?.stack);
    return false;
  }
}
