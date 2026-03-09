/**
 * @fileoverview Отключение updateLoop для клиента Telegram
 * @module server/telegram/services/client/disable-update-loop
 */

import { TelegramClient } from 'telegram';

/**
 * Отключает updateLoop у клиента для предотвращения TIMEOUT ошибок
 * @param client - Клиент Telegram
 */
export function disableUpdateLoop(client: TelegramClient): void {
  (client as any)._updateLoop = () => {};
}
