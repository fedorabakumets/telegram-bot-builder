/**
 * @fileoverview Утилита для извлечения ID пользователя из participant
 * @module server/telegram/utils/client/participant-id-extractor
 */

/**
 * Извлекает ID пользователя из объекта participant
 * @param participant - Объект участника Telegram API
 * @returns ID пользователя или null
 */
export function extractParticipantId(participant: any): string | null {
  // Пробуем разные способы извлечения user ID
  const userId =
    participant.userId ??
    participant.user_id ??
    participant.peer?.user_id ??
    participant.peer?.userId;

  return userId?.toString() ?? null;
}
