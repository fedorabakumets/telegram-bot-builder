/**
 * @fileoverview Утилита для получения сущности чата
 * @module server/telegram/utils/client/chat-entity-resolver
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';

/**
 * Получает сущность чата по ID
 * @param client - Клиент Telegram
 * @param chatId - ID чата (строка или число)
 * @returns Сущность чата для API вызовов
 */
export async function resolveChatEntity(
  client: TelegramClient,
  chatId: string | number
): Promise<any> {
  try {
    // Пробуем получить напрямую
    return await client.getEntity(chatId);
  } catch (entityError) {
    // Если ID начинается с -100, это супергруппа/канал
    if (typeof chatId === 'string' && chatId.startsWith('-100')) {
      const channelId = chatId.slice(4);
      return new Api.PeerChannel({ channelId: channelId as any });
    }

    throw new Error(`Не удалось найти чат с ID: ${chatId}`);
  }
}
