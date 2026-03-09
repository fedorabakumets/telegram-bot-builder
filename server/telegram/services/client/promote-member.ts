/**
 * @fileoverview Назначение участника администратором
 * @module server/telegram/services/client/promote-member
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import { resolveUserEntity } from '../../utils/client/user-entity-resolver.js';
import { createAdminRights } from '../../utils/client/admin-rights-builder.js';
import type { AdminRights } from '../../types/client/admin-rights.js';

/**
 * Назначает участника администратором чата
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param memberId - ID участника
 * @param adminRights - Права администратора
 * @returns Результат операции
 */
export async function promoteMember(
  client: TelegramClient,
  chatId: string | number,
  memberId: string,
  adminRights: AdminRights
): Promise<any> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);
    const userEntity = await resolveUserEntity(client, parseInt(memberId));

    const rights = createAdminRights(adminRights);

    return await client.invoke(
      new Api.channels.EditAdmin({
        channel: chatEntity,
        userId: userEntity,
        adminRights: rights,
        rank: adminRights.custom_title || '',
      })
    );
  } catch (error: any) {
    console.error('Failed to promote member:', error);
    throw new Error(`Failed to promote member: ${error.message || 'Unknown error'}`);
  }
}
