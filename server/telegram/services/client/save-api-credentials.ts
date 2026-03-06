/**
 * @fileoverview Сохранение API credentials в базу данных
 * @module server/telegram/services/client/save-api-credentials
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';

/**
 * Сохраняет или обновляет API credentials пользователя в базе данных
 * @param userId - ID пользователя
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 */
export async function saveApiCredentials(
  userId: string,
  apiId: string,
  apiHash: string
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
          apiId,
          apiHash,
          updatedAt: new Date(),
        })
        .where(eq(userTelegramSettings.userId, userId));
    } else {
      await db.insert(userTelegramSettings).values({
        userId,
        apiId,
        apiHash,
      });
    }
    console.log(`💾 API credentials сохранены для пользователя ${userId}`);
  } catch (error) {
    console.error('Ошибка сохранения credentials:', error);
  }
}
