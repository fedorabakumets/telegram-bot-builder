/**
 * @fileoverview Создание клиента Telegram
 * @module server/telegram/services/client/create-telegram-client
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import { createQRClient } from '../auth/create-qr-client.js';

/**
 * Создаёт нового клиента Telegram с заданной конфигурацией
 * @param config - Конфигурация клиента
 * @returns Подключённый клиент Telegram
 */
export async function createTelegramClient(config: TelegramClientConfig): Promise<TelegramClient> {
  const { apiId, apiHash } = config;
  return createQRClient(apiId, apiHash);
}
