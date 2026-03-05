/**
 * @fileoverview Утилита сохранения API credentials в базу данных
 * @module server/telegram/utils/auth/save-credentials
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../database/db.js';
import type { CredentialsResult } from '../../types/auth/credentials-result.js';

/**
 * Сохраняет API credentials пользователя в базу данных
 *
 * @param userId - ID пользователя
 * @param apiId - API ID приложения Telegram
 * @param apiHash - API Hash приложения Telegram
 * @returns Результат операции сохранения
 *
 * @example
 * ```typescript
 * const result = await saveCredentials('user123', '19827705', '52359acb...');
 * if (result.success) {
 *   console.log('Credentials сохранены');
 * }
 * ```
 */
export async function saveCredentials(
  userId: string,
  apiId: string,
  apiHash: string
): Promise<CredentialsResult> {
  try {
    const existing = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(userTelegramSettings)
        .set({ apiId, apiHash, updatedAt: new Date() })
        .where(eq(userTelegramSettings.userId, userId));
    } else {
      await db.insert(userTelegramSettings).values({
        userId,
        apiId,
        apiHash,
      });
    }

    console.log(`💾 API credentials сохранены для пользователя ${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error('❌ Ошибка сохранения credentials:', error.message);
    return { success: false, error: error.message };
  }
}
