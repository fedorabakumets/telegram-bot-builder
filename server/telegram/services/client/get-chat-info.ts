/**
 * @fileoverview Получение информации о чате
 * @module server/telegram/services/client/get-chat-info
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import type { ChatInfo } from '../../types/client/chat-info.js';

/**
 * Получает информацию о чате/канале/группе
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @returns Информация о чате
 */
export async function getChatInfo(
  client: TelegramClient,
  chatId: string | number
): Promise<ChatInfo> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);

    const result = await client.invoke(
      new Api.channels.GetFullChannel({
        channel: chatEntity,
      })
    );

    return {
      id: result.fullChat.id.toString(),
      title: (result.chats[0] as any)?.title || 'Unknown',
      participantsCount: (result.fullChat as any)?.participantsCount,
      about: (result.fullChat as any)?.about || '',
      chatPhoto: (result.chats[0] as any)?.photo || null,
    };
  } catch (error: any) {
    console.error('Detailed error:', error?.message, error?.stack);
    throw new Error(`Failed to get chat info: ${error?.message || 'Unknown error'}`);
  }
}
