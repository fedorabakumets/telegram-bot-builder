/**
 * @fileoverview Отключение клиента Telegram
 * @module server/telegram/services/client/disconnect-telegram-client
 */

import { TelegramClient } from 'telegram';

/**
 * Отключает клиента Telegram
 * @param client - Клиент Telegram для отключения
 */
export async function disconnectTelegramClient(client: TelegramClient): Promise<void> {
  try {
    await client.disconnect();
    console.log('✅ Клиент Telegram отключен');
  } catch (error) {
    console.error('Ошибка при отключении клиента:', error);
  }
}
