/**
 * @fileoverview Инициализация менеджера с восстановлением сессий
 * @module server/telegram/services/client/initialize-manager
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';
import { restoreSession } from './restore-session.js';

/**
 * Инициализирует менеджер и восстанавливает все активные сессии из БД
 * @param clients - Map для хранения клиентов
 * @param sessions - Map для хранения сессий
 * @param authStatus - Map для хранения статусов авторизации
 */
export async function initializeManager(
  clients: Map<string, any>,
  sessions: Map<string, string>,
  authStatus: Map<string, any>
): Promise<void> {
  try {
    const allSessions = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.isActive, 1));

    console.log(`🔄 Восстанавливаем ${allSessions.length} сессий из базы данных...`);

    for (const sessionData of allSessions) {
      if (sessionData.sessionString && sessionData.userId) {
        await restoreSession(sessionData.userId, clients, sessions, authStatus);
      }
    }

    console.log('✅ Все сессии восстановлены');
  } catch (error) {
    console.error('Ошибка при восстановлении сессий:', error);
  }
}
