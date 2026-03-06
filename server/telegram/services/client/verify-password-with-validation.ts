/**
 * @fileoverview Проверка 2FA пароля с валидацией
 * @module server/telegram/services/client/verify-password-with-validation
 */

import { TelegramClient } from 'telegram';
import { verifyPasswordWithSession } from './verify-password-with-session.js';

/**
 * Проверяет 2FA пароль с предварительной валидацией
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param authStatus - Текущий статус авторизации
 * @param password - Пароль 2FA
 * @param sessions - Map сессий
 * @param authStatusMap - Map статусов
 * @returns Результат проверки
 */
export async function verifyPasswordWithValidation(
  userId: string,
  client: TelegramClient | undefined,
  authStatus: any | undefined,
  password: string,
  sessions: Map<string, string>,
  authStatusMap: Map<string, any>
): Promise<{ success: boolean; error?: string }> {
  if (!client) {
    return { success: false, error: 'Клиент не найден. Сначала отправьте код.' };
  }

  if (!authStatus || !authStatus.needsPassword) {
    return { success: false, error: 'Проверка пароля не требуется.' };
  }

  return verifyPasswordWithSession(userId, client, authStatus, password, sessions, authStatusMap);
}
