/**
 * @fileoverview Утилита для определения статуса участника
 * @module server/telegram/utils/client/member-status-resolver
 */

/**
 * Определяет статус участника по классу объекта
 * @param participant - Объект участника Telegram API
 * @returns Статус участника: creator, administrator, kicked, member
 */
export function resolveMemberStatus(participant: any): string {
  const className = participant.className;

  if (className === 'ChannelParticipantCreator') return 'creator';
  if (className === 'ChannelParticipantAdmin') return 'administrator';
  if (className === 'ChannelParticipantBanned') return 'kicked';
  if (className === 'ChannelParticipantLeft') return 'left';

  return 'member';
}
