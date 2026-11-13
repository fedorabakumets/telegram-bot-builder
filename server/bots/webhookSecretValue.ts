/** @fileoverview Создание индивидуального секрета Telegram webhook. */
import { randomBytes } from 'node:crypto';

/** Возвращает существующий секрет либо создаёт совместимый с Telegram случайный секрет. */
export function resolveWebhookSecret(value?: string | null): string {
  if (value?.trim()) return value;
  return randomBytes(32).toString('hex');
}
