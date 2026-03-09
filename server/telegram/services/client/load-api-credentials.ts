/**
 * @fileoverview Загрузка API credentials из базы данных
 * @module server/telegram/services/client/load-api-credentials
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';

/**
 * Загружает API credentials пользователя из базы данных
 * @param userId - ID пользователя
 * @returns Объект с apiId и apiHash или null
 */
export async function loadApiCredentials(
  userId: string
): Promise<{ apiId: string; apiHash: string } | null> {
  try {
    const result = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.userId, userId))
      .limit(1);

    if (result.length > 0 && result[0].apiId && result[0].apiHash) {
      return {
        apiId: result[0].apiId,
        apiHash: result[0].apiHash,
      };
    }
    return null;
  } catch (error) {
    console.error('Ошибка загрузки credentials из БД:', error);
    return null;
  }
}
