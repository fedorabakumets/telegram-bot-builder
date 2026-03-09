/**
 * @fileoverview Исключение участника из группы
 * @module server/telegram/services/client/kick-member
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import { resolveUserEntity } from '../../utils/client/user-entity-resolver.js';
import { createBannedRights } from '../../utils/client/banned-rights-builder.js';

/**
 * Исключает участника из чата/канала (бан на 60 секунд)
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param memberId - ID участника
 * @returns Результат операции
 */
export async function kickMember(
  client: TelegramClient,
  chatId: string | number,
  memberId: string
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);
    const userEntity = await resolveUserEntity(client, parseInt(memberId));

    const bannedRights = createBannedRights(
      {
        viewMessages: true,
        sendMessages: true,
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
      Math.floor(Date.now() / 1000) + 60
    );

    return await client.invoke(
      new Api.channels.EditBanned({
        channel: chatEntity,
        participant: userEntity,
        bannedRights,
      })
    );
  } catch (error: any) {
    console.error('Failed to kick member:', error);
    throw new Error(`Failed to kick member: ${error.message || 'Unknown error'}`);
  }
}
