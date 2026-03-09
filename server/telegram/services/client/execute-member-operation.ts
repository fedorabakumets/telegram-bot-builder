/**
 * @fileoverview Выполнение операции с участником чата
 * @module server/telegram/services/client/member-operation
 */

import { TelegramClient } from 'telegram';
import { checkAuthForOperation } from './check-auth-for-operation.js';

/**
 * Выполняет операцию с участником чата с проверкой авторизации
 * @param client - Клиент Telegram
 * @param authStatus - Статус авторизации
 * @param operation - Функция операции (принимает client)
 * @returns Результат операции
 */
export async function executeMemberOperation<T>(
  client: TelegramClient | null,
  authStatus: any,
  operation: (client: TelegramClient) => Promise<T>
): Promise<T> {
  checkAuthForOperation(client, authStatus);
  return operation(client!);
}
