/**
 * @fileoverview Проверка авторизации перед операцией
 * @module server/telegram/services/client/check-auth-for-operation
 */

import { TelegramClient } from 'telegram';

/**
 * Проверяет наличие клиента и авторизацию перед выполнением операции
 * @param client - Клиент Telegram или null
 * @param authStatus - Статус авторизации
 * @throws Error если клиент не найден или не авторизован
 */
export function checkAuthForOperation(
  client: TelegramClient | null,
  authStatus?: { isAuthenticated?: boolean }
): void {
  if (!client) {
    throw new Error('Telegram client not found. Please authenticate first.');
  }

  if (authStatus && !authStatus.isAuthenticated) {
    throw new Error('User not authenticated. Please complete phone verification first.');
  }
}
