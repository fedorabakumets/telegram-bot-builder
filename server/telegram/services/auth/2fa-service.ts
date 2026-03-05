/**
 * @fileoverview Сервис проверки 2FA пароля Telegram
 * @module server/telegram/services/auth/2fa-service
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram';
import type { VerifyPasswordResult } from '../../types/auth/verify-password-result.js';

/**
 * Проверяет пароль двухфакторной аутентификации (2FA) Telegram
 *
 * @param client - Подключенный клиент Telegram
 * @param password - Пароль 2FA от пользователя
 * @returns Результат проверки пароля
 *
 * @example
 * ```typescript
 * const result = await verifyPassword(client, 'mySecretPassword');
 * if (result.success) {
 *   console.log('2FA авторизация успешна');
 * }
 * ```
 */
export async function verifyPassword(
  client: TelegramClient,
  password: string
): Promise<VerifyPasswordResult> {
  try {
    // Получаем информацию о пароле (SRP параметры)
    const passwordInfo = await client.invoke(new Api.account.GetPassword());

    // Импортируем функцию для вычисления SRP проверки
    const { computeCheck } = await import('telegram/Password');

    // Вычисляем проверку пароля
    const passwordCheck = await computeCheck(passwordInfo, password);

    // Проверяем пароль через Telegram API
    await client.invoke(
      new Api.auth.CheckPassword({
        password: passwordCheck,
      })
    );

    console.log('✅ 2FA пароль проверен успешно');
    return { success: true };
  } catch (error: any) {
    console.error('❌ Ошибка проверки 2FA пароля:', error.message);
    return {
      success: false,
      error: error.message || 'Неверный пароль 2FA',
    };
  }
}
