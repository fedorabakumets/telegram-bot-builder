/**
 * @fileoverview Установка названия чата
 * @module server/telegram/services/client/set-chat-title
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';

/**
 * Устанавливает название чата/канала
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param title - Новое название
 * @returns Результат операции
 */
export async function setChatTitle(
  client: TelegramClient,
  chatId: string | number,
  title: string
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);

    const result = await client.invoke(
      new Api.channels.EditTitle({
        channel: chatEntity,
        title,
      })
    );

    return result;
  } catch (error: any) {
    console.error('Failed to set chat title:', error);
    throw new Error(`Failed to set chat title: ${error.message || 'Unknown error'}`);
  }
}
