/**
 * @fileoverview Ограничение участника группы (мут)
 * @module server/telegram/services/client/restrict-member
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import { resolveUserEntity } from '../../utils/client/user-entity-resolver.js';
import { createBannedRights } from '../../utils/client/banned-rights-builder.js';

/**
 * Ограничивает права участника в чате (мут)
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param memberId - ID участника
 * @param untilDate - Дата снятия ограничений (по умолчанию 1 час)
 * @returns Результат операции
 */
export async function restrictMember(
  client: TelegramClient,
  chatId: string | number,
  memberId: string,
  untilDate?: number
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);
    const userEntity = await resolveUserEntity(client, parseInt(memberId));

    const bannedRights = createBannedRights(
      {
        viewMessages: false, // Может видеть сообщения
        sendMessages: true, // Не может писать
        sendMedia: true,
        sendStickers: true,
        sendGifs: true,
        sendGames: true,
        sendInline: true,
        embedLinks: true,
        sendPolls: true,
        changeInfo: true,
        inviteUsers: true,
        pinMessages: true,
        manageTopics: true,
      },
      untilDate || Math.floor(Date.now() / 1000) + 3600
    );

    return await client.invoke(
      new Api.channels.EditBanned({
        channel: chatEntity,
        participant: userEntity,
        bannedRights,
      })
    );
  } catch (error: any) {
    console.error('Failed to restrict member:', error);
    throw new Error(`Failed to restrict member: ${error.message || 'Unknown error'}`);
  }
}
