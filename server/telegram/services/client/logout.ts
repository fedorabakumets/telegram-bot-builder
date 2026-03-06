/**
 * @fileoverview Выход пользователя (logout)
 * @module server/telegram/services/client/logout
 */

import { TelegramClient } from 'telegram';

/**
 * Выполняет выход пользователя и отключает клиента
 * @param client - Клиент Telegram для отключения
 * @returns Результат выхода
 */
export async function logout(
  client: TelegramClient
): Promise<{ success: boolean; error?: string }> {
  try {
    await client.disconnect();
    console.log('✅ Пользователь вышел из Telegram Client API');
    return { success: true };
  } catch (error: any) {
    console.error('Ошибка при выходе:', error);
    return { success: false, error: error.message || 'Ошибка при выходе' };
  }
}
