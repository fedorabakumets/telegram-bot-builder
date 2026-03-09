/**
 * @fileoverview Информация о чате
 * @module server/telegram/types/client/chat-info
 */

/**
 * Информация о чате/канале/группе
 */
export interface ChatInfo {
  /** ID чата */
  id: string;

  /** Название чата */
  title: string;

  /** Количество участников */
  participantsCount?: number;

  /** Описание чата */
  about?: string;

  /** Фото чата */
  chatPhoto?: any | null;
}
