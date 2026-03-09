/**
 * @fileoverview Расширение менеджера для операций с чатами
 * @module server/telegram/services/client/telegram-client-manager-v2-chats
 * @description Предоставляет методы для управления чатами
 */

import type { ChatModule } from './chat-module.js';

/**
 * Расширение менеджера для операций с чатами
 */
export class ChatMethods {
  constructor(private readonly chat: ChatModule) {}

  /**
   * Получить информацию о чате
   */
  async getChatInfo(userId: string, chatId: string | number): Promise<any> {
    return this.chat.getChatInfo(userId, chatId);
  }

  /**
   * Установить username чата
   */
  async setChatUsername(
    userId: string,
    chatId: string | number,
    username: string
  ): Promise<any> {
    return this.chat.setChatUsername(userId, chatId, username);
  }

  /**
   * Установить фото чата
   */
  async setChatPhoto(
    userId: string,
    chatId: string | number,
    photoPath: string
  ): Promise<any> {
    return this.chat.setChatPhoto(userId, chatId, photoPath);
  }
}
