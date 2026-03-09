/**
 * @fileoverview Проверка валидности сессии через getMe
 * @module server/telegram/services/client/validate-session
 */

import { TelegramClient } from 'telegram';

/**
 * Проверяет валидность сессии, получая информацию о пользователе
 * @param client - Клиент Telegram
 * @returns Данные пользователя или null, если сессия невалидна
 */
export async function validateSession(client: TelegramClient): Promise<{
  phoneNumber?: string;
  userId?: string;
  username?: string;
} | null> {
  try {
    const me = await client.getMe();
    if (me) {
      return {
        phoneNumber: (me as any).phone,
        userId: (me as any).userId?.toString() || me?.id?.toString(),
        username: me?.username || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Ошибка проверки сессии:', error);
    return null;
  }
}
