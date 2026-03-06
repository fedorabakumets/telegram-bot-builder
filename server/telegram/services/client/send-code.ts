/**
 * @fileoverview Отправка кода подтверждения через Telegram API
 * @module server/telegram/services/client/send-code
 */

import { TelegramClient } from 'telegram';
import { Api } from 'telegram/tl';

/**
 * Отправляет код подтверждения на номер телефона
 * @param client - Клиент Telegram
 * @param phoneNumber - Номер телефона
 * @param apiId - API ID
 * @param apiHash - API Hash
 * @returns Результат отправки с phoneCodeHash
 */
export async function sendCode(
  client: TelegramClient,
  phoneNumber: string,
  apiId: number,
  apiHash: string
): Promise<{ success: boolean; phoneCodeHash?: string; error?: string; codeType?: string }> {
  try {
    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber,
        apiId,
        apiHash,
        settings: new Api.CodeSettings({
          allowFlashcall: true,
          currentNumber: true,
          allowAppHash: true,
        }),
      })
    );

    const codeType = (result as any).type;
    let codeDelivery = 'SMS';
    if (codeType?._ === 'auth.sentCodeTypeApp') {
      codeDelivery = 'уведомление в Telegram';
    } else if (codeType?._ === 'auth.sentCodeTypeCall') {
      codeDelivery = 'голосовой звонок';
    } else if (codeType?._ === 'auth.sentCodeTypeFlashCall') {
      codeDelivery = 'flash-звонок';
    }

    console.log(`📱 Код отправлен на ${phoneNumber} через ${codeDelivery}`);

    return {
      success: true,
      phoneCodeHash: (result as any).phoneCodeHash,
      codeType: codeType?._,
    };
  } catch (error: any) {
    console.error('Detailed error:', error?.message, error?.stack);
    return {
      success: false,
      error: error.message || 'Неизвестная ошибка при отправке кода',
    };
  }
}
