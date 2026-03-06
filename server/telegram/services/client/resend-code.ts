/**
 * @fileoverview Повторная отправка кода через звонок
 * @module server/telegram/services/client/resend-code
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';

/**
 * Повторно отправляет код подтверждения через звонок
 * @param client - Клиент Telegram
 * @param phoneNumber - Номер телефона
 * @param phoneCodeHash - Хеш предыдущего кода
 * @returns Результат повторной отправки
 */
export async function resendCode(
  client: TelegramClient,
  phoneNumber: string,
  phoneCodeHash: string
): Promise<{ success: boolean; phoneCodeHash?: string; error?: string }> {
  try {
    const result = await client.invoke(
      new Api.auth.ResendCode({
        phoneNumber,
        phoneCodeHash,
      })
    );

    console.log(`📞 Код отправлен через звонок на ${phoneNumber}`);

    return {
      success: true,
      phoneCodeHash: (result as any).phoneCodeHash,
    };
  } catch (error: any) {
    console.error('Ошибка при повторной отправке кода:', error?.message);
    return {
      success: false,
      error: error.message || 'Не удалось отправить код',
    };
  }
}
