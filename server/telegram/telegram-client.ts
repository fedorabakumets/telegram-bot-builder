/**
 * @fileoverview Telegram Client Module
 * @module server/telegram/telegram-client
 */

export { TelegramClientManager } from './services/client/telegram-client-manager.js';

/**
 * Экспорт единственного экземпляра
 */
import { TelegramClientManager } from './services/client/telegram-client-manager.js';
export const telegramClientManager = new TelegramClientManager();

/**
 * Функция инициализации
 */
export function initializeTelegramManager() {
  return telegramClientManager.initialize();
}
