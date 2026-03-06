/**
 * @fileoverview Операции с чатами
 * @module server/telegram/services/client/chat-operations
 */

import { TelegramClient } from 'telegram';
import { getClient } from './get-client.js';
import { setChatUsernameWithCheck } from './set-chat-username-with-check.js';
import { setChatPhotoWithCheck } from './set-chat-photo-with-check.js';

/**
 * Сервис для выполнения операций с чатами
 */
export class ChatOperations {
  private clients: Map<string, TelegramClient>;

  constructor(clients: Map<string, TelegramClient>) {
    this.clients = clients;
  }

  /**
   * Установить username чата
   */
  async setUsername(userId: string, chatId: string | number, username: string): Promise<any> {
    const client = getClient(userId, this.clients);
    return setChatUsernameWithCheck(userId, client, chatId, username);
  }

  /**
   * Установить фото чата
   */
  async setPhoto(userId: string, chatId: string | number, photoPath: string): Promise<any> {
    const client = getClient(userId, this.clients);
    return setChatPhotoWithCheck(userId, client, chatId, photoPath);
  }
}
