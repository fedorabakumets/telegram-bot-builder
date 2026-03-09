/**
 * @fileoverview Утилита для получения сущности пользователя
 * @module server/telegram/utils/client/user-entity-resolver
 */

import { TelegramClient } from 'telegram';

/**
 * Получает сущность пользователя по ID
 * @param client - Клиент Telegram
 * @param userId - ID пользователя (число)
 * @returns Сущность пользователя для API вызовов
 */
export async function resolveUserEntity(
  client: TelegramClient,
  userId: number
): Promise<any> {
  return await client.getEntity(userId);
}
