/**
 * @fileoverview Проверка 2FA пароля
 * @module server/telegram/services/client/verify-password
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';

/**
 * Проверяет пароль двухфакторной аутентификации
 * @param client - Клиент Telegram
 * @param password - Пароль 2FA
 * @returns Результат проверки
 */
export async function verifyPassword(
  client: TelegramClient,
  password: string
): Promise<{ success: boolean; error?: string; sessionString?: string }> {
  try {
    const passwordInfo = await client.invoke(new Api.account.GetPassword());
    const { computeCheck } = await import('telegram/Password');
    const passwordCheck = await computeCheck(passwordInfo, password);

    await client.invoke(
      new Api.auth.CheckPassword({
        password: passwordCheck,
      })
    );

    const sessionString = (client.session.save() as any) || '';

    console.log('✅ 2FA пароль проверен успешно');

    return {
      success: true,
      sessionString,
    };
  } catch (error: any) {
    console.error('Detailed error:', error?.message, error?.stack);
    return {
      success: false,
      error: error.message === 'PASSWORD_HASH_INVALID' ? 'Неверный пароль' : error.message || 'Ошибка авторизации',
    };
  }
}
