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
    // Указываем информацию об устройстве для корректного отображения в Telegram
    appVersion: '1.0.0',
    deviceModel: 'Server Bot Builder',
    systemVersion: typeof process !== 'undefined' && process.platform ? (process.platform === 'win32' ? 'Windows_NT' : process.platform) : 'Unknown',
  });

  return client;
}
