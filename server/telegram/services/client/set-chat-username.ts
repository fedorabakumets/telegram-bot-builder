/**
 * @fileoverview Установка username чата
 * @module server/telegram/services/client/set-chat-username
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';

/**
 * Устанавливает username чата (делает публичным или приватным)
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param username - Username (пустая строка = приватный чат)
 * @returns Результат операции
 */
export async function setChatUsername(
  client: TelegramClient,
  chatId: string | number,
  username: string
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);

    const result = await client.invoke(
      new Api.channels.UpdateUsername({
        channel: chatEntity,
        username: username || '',
      })
    );

    return result;
  } catch (error: any) {
    console.error('Failed to set chat username:', error);
    throw new Error(`Failed to set chat username: ${error.message || 'Unknown error'}`);
  }
}
