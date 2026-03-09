/**
 * @fileoverview Проверка 2FA пароля с обновлением состояния
 * @module server/telegram/services/client/verify-password-with-session
 */

import { TelegramClient } from 'telegram';
import { verifyPassword } from './verify-password.js';
import { saveSessionToDb } from './save-session-to-db.js';

/**
 * Проверяет 2FA пароль и обновляет сессию пользователя
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param authStatus - Текущий статус авторизации
 * @param password - Пароль 2FA
 * @param sessions - Map сессий для обновления
 * @param authStatusMap - Map статусов для обновления
 * @returns Результат проверки
 */
export async function verifyPasswordWithSession(
  userId: string,
  client: TelegramClient,
  authStatus: any,
  password: string,
  sessions: Map<string, string>,
  authStatusMap: Map<string, any>
): Promise<{ success: boolean; error?: string }> {
  const result = await verifyPassword(client, password);

  if (result.success && result.sessionString) {
    sessions.set(userId, result.sessionString);
    await saveSessionToDb(userId, result.sessionString, authStatus.phoneNumber || '');

    authStatusMap.set(userId, {
      isAuthenticated: true,
      phoneNumber: authStatus.phoneNumber,
      userId,
      needsCode: false,
      needsPassword: false,
    });

    console.log(`✅ Пользователь ${authStatus.phoneNumber} успешно авторизован с 2FA`);
  }

  return result;
}
