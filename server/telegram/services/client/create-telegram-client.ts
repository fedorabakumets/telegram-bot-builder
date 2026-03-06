/**
 * @fileoverview Создание клиента Telegram
 * @module server/telegram/services/client/create-telegram-client
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';

/**
 * Создаёт нового клиента Telegram с заданной конфигурацией
 * @param config - Конфигурация клиента
 * @returns Подключенный клиент Telegram
 */
export function createTelegramClient(config: TelegramClientConfig): TelegramClient {
  const { apiId, apiHash, session } = config;

  const stringSession = new StringSession(session || '');
  const client = new TelegramClient(stringSession, parseInt(apiId!), apiHash!, {
    connectionRetries: 5,
    useWSS: false,
    autoReconnect: true,
  });

  return client;
}
