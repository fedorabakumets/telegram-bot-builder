/**
 * @fileoverview Установка описания чата
 * @module server/telegram/services/client/set-chat-description
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';

/**
 * Устанавливает описание чата/канала
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param description - Новое описание
 * @returns Результат операции
 */
export async function setChatDescription(
  client: TelegramClient,
  chatId: string | number,
  description: string
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);

    const result = await client.invoke(
      new Api['channels']['EditAbout']({
        channel: chatEntity,
        about: description,
      })
    );

    return result;
  } catch (error: any) {
    console.error('Failed to set chat description:', error);
    throw new Error(`Failed to set chat description: ${error.message || 'Unknown error'}`);
  }
}
