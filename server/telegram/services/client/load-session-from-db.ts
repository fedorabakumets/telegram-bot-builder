/**
 * @fileoverview Загрузка сессии пользователя из базы данных
 * @module server/telegram/services/client/load-session-from-db
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';

/**
 * Загружает строку сессии из базы данных для пользователя
 * @param userId - ID пользователя
 * @returns Строка сессии или null, если не найдена
 */
export async function loadSessionFromDb(userId: string): Promise<string | null> {
  try {
    const result = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.userId, userId))
      .limit(1);

    if (result.length > 0 && result[0].sessionString) {
      console.log(`🔄 Сессия загружена из БД для пользователя ${userId}`);
      return result[0].sessionString;
    }
    return null;
  } catch (error) {
    console.error('Ошибка загрузки сессии из БД:', error);
    return null;
  }
}
