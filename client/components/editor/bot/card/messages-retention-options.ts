/**
 * @fileoverview Варианты UI для срока хранения сообщений
 * @module bot/card/messages-retention-options
 */

import {
  MESSAGES_RETENTION_DAYS_VALUES,
  type MessagesRetentionDays,
} from '@shared/messages-retention';

/** Подписи селекта «Хранить сообщения» */
export const RETENTION_OPTIONS: Array<{ value: MessagesRetentionDays; label: string }> = [
  { value: 0, label: 'Безлимит' },
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 60, label: '60 дней' },
  { value: 90, label: '90 дней' },
  { value: 180, label: '180 дней' },
  { value: 365, label: '365 дней' },
];

/**
 * Нормализует значение к допустимому сроку
 * @param value - Сырое значение из токена
 * @returns Допустимое значение из whitelist
 */
export function normalizeRetentionDays(value: number | null): MessagesRetentionDays {
  const n = value ?? 0;
  return (MESSAGES_RETENTION_DAYS_VALUES as readonly number[]).includes(n)
    ? (n as MessagesRetentionDays)
    : 0;
}
