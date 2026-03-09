/**
 * @fileoverview Сохранение сессии пользователя в базу данных
 * @module server/telegram/services/client/save-session-to-db
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';

/**
 * Сохраняет или обновляет сессию пользователя в базе данных
 * @param userId - ID пользователя
 * @param sessionString - Строка сессии
 * @param phoneNumber - Номер телефона пользователя
 */
export async function saveSessionToDb(
  userId: string,
  sessionString: string,
  phoneNumber: string
): Promise<void> {
  try {
    const existing = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userTelegramSettings)
        .set({
          sessionString,
          phoneNumber,
          updatedAt: new Date(),
        })
        .where(eq(userTelegramSettings.userId, userId));
    } else {
      await db.insert(userTelegramSettings).values({
        userId,
        sessionString,
        phoneNumber,
      });
    }
    console.log(`💾 Сессия сохранена в БД для пользователя ${phoneNumber}`);
  } catch (error) {
    console.error('Ошибка сохранения сессии в БД:', error);
  }
}
