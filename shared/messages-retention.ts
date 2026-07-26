/**
 * @fileoverview Допустимые значения срока хранения сообщений диалога
 * @module shared/messages-retention
 */

/** Разрешённые значения messagesRetentionDays (0 = безлимит) */
export const MESSAGES_RETENTION_DAYS_VALUES = [0, 7, 30, 60, 90, 180, 365] as const;

/** Тип допустимого срока хранения в днях */
export type MessagesRetentionDays = (typeof MESSAGES_RETENTION_DAYS_VALUES)[number];

/**
 * Проверяет, что число — допустимый срок хранения
 * @param value - Проверяемое значение
 * @returns true если значение из whitelist
 */
export function isMessagesRetentionDays(value: number): value is MessagesRetentionDays {
  return (MESSAGES_RETENTION_DAYS_VALUES as readonly number[]).includes(value);
}
