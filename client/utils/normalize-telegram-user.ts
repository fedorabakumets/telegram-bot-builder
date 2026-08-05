/**
 * @fileoverview Нормализация пользователя Telegram из ответа API
 * @module utils/normalize-telegram-user
 */

import type { TelegramUser } from '@/types/telegram-user';

/**
 * Нормализует пользователя из ответа API (camelCase или snake_case)
 * @param raw - Сырой объект пользователя
 * @returns TelegramUser или null
 */
export function normalizeTelegramUser(
  raw: Record<string, unknown> | null | undefined,
): TelegramUser | null {
  if (!raw || raw.id == null) return null;
  return {
    id: Number(raw.id),
    firstName: String(raw.firstName ?? raw.first_name ?? ''),
    lastName: (raw.lastName ?? raw.last_name) as string | undefined,
    username: (raw.username as string | undefined) ?? undefined,
    photoUrl: (raw.photoUrl ?? raw.photo_url) as string | null | undefined,
  };
}
