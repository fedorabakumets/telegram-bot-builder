/**
 * @fileoverview Снятие администраторских прав
 * @module server/telegram/services/client/demote-member
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import { resolveUserEntity } from '../../utils/client/user-entity-resolver.js';
import { createAdminRights } from '../../utils/client/admin-rights-builder.js';

/**
 * Снимает администраторские права у участника
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param memberId - ID участника
 * @returns Результат операции
 */
export async function demoteMember(
  client: TelegramClient,
  chatId: string | number,
  memberId: string
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);
    const userEntity = await resolveUserEntity(client, parseInt(memberId));

    const rights = createAdminRights({
      can_change_info: false,
      can_post_messages: false,
      can_edit_messages: false,
      can_delete_messages: false,
      can_restrict_members: false,
      can_invite_users: false,
      can_pin_messages: false,
      can_promote_members: false,
      can_manage_video_chats: false,
      can_be_anonymous: false,
      can_manage_topics: false,
      can_post_stories: false,
      can_edit_stories: false,
      can_delete_stories: false,
    });

    return await client.invoke(
      new Api.channels.EditAdmin({
        channel: chatEntity,
        userId: userEntity,
        adminRights: rights,
        rank: '',
      })
    );
  } catch (error: any) {
    console.error('Failed to demote member:', error);
    throw new Error(`Failed to demote member: ${error.message || 'Unknown error'}`);
  }
}
