/**
 * @fileoverview Утилита загрузки API credentials из базы данных
 * @module server/telegram/utils/auth/load-credentials
 */

import { userTelegramSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { db } from '../../../database/db.js';
import type { UserCredentials } from '../../../types/auth/user-credentials.js';

/**
 * Загружает API credentials пользователя из базы данных
 *
 * @param userId - ID пользователя
 * @returns Credentials пользователя или null, если не найдены
 *
 * @example
 * ```typescript
 * const credentials = await loadCredentials('user123');
 * if (credentials) {
 *   console.log('API ID:', credentials.apiId);
 * }
 * ```
 */
export async function loadCredentials(
  userId: string
): Promise<UserCredentials | null> {
  try {
    const result = await db
      .select()
      .from(userTelegramSettings)
      .where(eq(userTelegramSettings.userId, userId))
      .limit(1);

    if (result.length > 0 && result[0].apiId && result[0].apiHash) {
      return { apiId: result[0].apiId, apiHash: result[0].apiHash };
    }

    return null;
  } catch (error: any) {
    console.error('❌ Ошибка загрузки credentials:', error.message);
    return null;
  }
}
