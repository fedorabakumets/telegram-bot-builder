/**
 * @fileoverview Получение списка участников группы
 * @module server/telegram/services/client/get-group-members
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';
import { resolveChatEntity } from '../../utils/client/chat-entity-resolver.js';
import { extractParticipantId } from '../../utils/client/participant-id-extractor.js';
import { resolveMemberStatus } from '../../utils/client/member-status-resolver.js';
import type { GroupMember } from '../../types/client/group-member.js';

/**
 * Получает список участников группы/канала
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @returns Массив участников группы
 */
export async function getGroupMembers(
  client: TelegramClient,
  chatId: string | number
): Promise<GroupMember[]> {
  try {
    const chatEntity = await resolveChatEntity(client, chatId);

    const result = await client.invoke(
      new Api.channels.GetParticipants({
        channel: chatEntity,
        filter: new Api.ChannelParticipantsRecent(),
        offset: 0,
        limit: 200,
        hash: 0 as any,
      })
    );

    if ('participants' in result) {
      return result.participants.map((participant: any) => {
        const participantId = extractParticipantId(participant);
        const user = result.users.find(
          (u: any) => u.id?.toString() === participantId?.toString()
        );

        return {
          id: participantId || '',
          username: (user as any)?.username || null,
          firstName: (user as any)?.firstName || null,
          lastName: (user as any)?.lastName || null,
          isBot: (user as any)?.bot || false,
          status: resolveMemberStatus(participant),
          joinedAt: participant.date ? new Date(participant.date * 1000) : null,
        };
      });
    }

    return [];
  } catch (error: any) {
    console.error('Detailed error:', error?.message, error?.stack);
    throw new Error(`Failed to get group members: ${error?.message || 'Unknown error'}`);
  }
}
