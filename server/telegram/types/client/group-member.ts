/**
 * @fileoverview Информация об участнике группы
 * @module server/telegram/types/client/group-member
 */

/**
 * Информация об участнике группы/канала
 */
export interface GroupMember {
  /** ID участника */
  id: string;

  /** Username участника */
  username: string | null;

  /** Имя участника */
  firstName: string | null;

  /** Фамилия участника */
  lastName: string | null;

  /** Является ли ботом */
  isBot: boolean;

  /** Статус участника в группе */
  status: string;

  /** Дата вступления в группу */
  joinedAt: Date | null;
}
