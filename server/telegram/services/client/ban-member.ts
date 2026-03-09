/**
 * @fileoverview Блокировка участника группы
 * @module server/telegram/services/client/ban-member
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import { resolveUserEntity } from '../../utils/client/user-entity-resolver.js';
import { createBannedRights } from '../../utils/client/banned-rights-builder.js';

/**
 * Блокирует участника в чате/канале
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param memberId - ID участника
 * @param untilDate - Дата разблокировки (0 = навсегда)
 * @returns Результат операции
 */
export async function banMember(
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
      untilDate || 0
    );

    return await client.invoke(
      new Api.channels.EditBanned({
        channel: chatEntity,
        participant: userEntity,
        bannedRights,
      })
    );
  } catch (error: any) {
    console.error('Failed to ban member:', error);
    throw new Error(`Failed to ban member: ${error.message || 'Unknown error'}`);
  }
}
