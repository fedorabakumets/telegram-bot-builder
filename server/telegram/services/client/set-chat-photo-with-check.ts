/**
 * @fileoverview Установка фото чата с проверкой
 * @module server/telegram/services/client/set-chat-photo-with-check
 */

import { TelegramClient } from 'telegram';
import { setChatPhoto } from './set-chat-photo.js';
import { executeMemberOperation } from './execute-member-operation.js';

/**
 * Устанавливает фото чата с проверкой авторизации
 * @param userId - ID пользователя
 * @param client - Клиент Telegram
 * @param chatId - ID чата
 * @param photoPath - Путь к фото
 * @returns Результат операции
 */
export async function setChatPhotoWithCheck(
  userId: string,
  client: TelegramClient | null,
  chatId: string | number,
  photoPath: string
): Promise<any> {
  return executeMemberOperation(client, undefined, (c) =>
    setChatPhoto(c, chatId, photoPath)
  );
}
