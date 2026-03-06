/**
 * @fileoverview Установка username чата с проверкой
 * @module server/telegram/services/client/set-chat-username-with-check
 */

import { TelegramClient } from 'telegram';
import { setChatUsername } from './set-chat-username.js';
import { executeMemberOperation } from './execute-member-operation.js';

/**
 * Устанавливает username чата с проверкой авторизации
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param username - Username
 * @returns Результат операции
 */
export async function setChatUsernameWithCheck(
  userId: string,
  client: TelegramClient | null,
  chatId: string | number,
  username: string
): Promise<any> {
  return executeMemberOperation(client, undefined, (c) =>
    setChatUsername(c, chatId, username)
  );
}
