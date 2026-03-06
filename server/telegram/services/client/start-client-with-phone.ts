/**
 * @fileoverview Запуск клиента Telegram с phone number
 * @module server/telegram/services/client/start-client-with-phone
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';

/**
 * Создаёт и запускает клиента Telegram с номером телефона
 * @param config - Конфигурация клиента
 * @returns Запущенный клиент Telegram
 */
export async function startClientWithPhone(
  config: TelegramClientConfig
): Promise<TelegramClient> {
  const { apiId, apiHash, session, phoneNumber } = config;

  const stringSession = new StringSession(session || '');
  const client = new TelegramClient(stringSession, parseInt(apiId!), apiHash!, {
    connectionRetries: 5,
    useWSS: false,
    autoReconnect: true,
  });

  await client.start({
    phoneNumber: phoneNumber || '',
    password: async () => {
      throw new Error('2FA not supported in this implementation');
    },
    phoneCode: async () => {
      throw new Error('Phone code verification not implemented');
    },
    onError: (err) => console.error('Telegram client error:', err),
  });

  return client;
}
