/**
 * @fileoverview Проверка кода подтверждения (signIn)
 * @module server/telegram/services/client/verify-code
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';

/**
 * Проверяет код подтверждения пользователя
 * @param client - Клиент Telegram
 * @param phoneNumber - Номер телефона
 * @param phoneCode - Код из SMS/звонка
 * @param phoneCodeHash - Хеш кода
 * @returns Результат проверки
 */
export async function verifyCode(
  client: TelegramClient,
  phoneNumber: string,
  phoneCode: string,
  phoneCodeHash: string
): Promise<{
  success: boolean;
  error?: string;
  needsPassword?: boolean;
  sessionString?: string;
}> {
  try {
    const signInResult = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );

    if (!signInResult) {
      throw new Error('Не удалось получить данные пользователя после входа');
    }

    const sessionString = (client.session.save() as any) || '';

    console.log(`✅ Пользователь ${phoneNumber} успешно авторизован`);

    return {
      success: true,
      sessionString,
    };
  } catch (error: any) {
    console.error('Detailed error:', error?.message, error?.stack);

    if (error.message && error.message.includes('SESSION_PASSWORD_NEEDED')) {
      return {
        success: false,
        needsPassword: true,
        error: 'Требуется пароль двухфакторной аутентификации',
      };
    }

    return {
      success: false,
      error: error.message || 'Неверный код подтверждения',
    };
  }
}
