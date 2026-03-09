/**
 * @fileoverview Модуль операций с чатами Telegram с валидацией
 * @module server/telegram/services/client/chat-module
 * @description Реализует операции управления чатами через делегирование
 */

import type { IChatModule } from '../../types/client/modules.js';
import { TelegramStore } from './telegram-store.js';
import { getClient } from './get-client.js';
import { setChatUsernameWithCheck } from './set-chat-username-with-check.js';
import { setChatPhotoWithCheck } from './set-chat-photo-with-check.js';
import { getChatInfo } from './get-chat-info.js';
import {
  validateRequired,
  validateChatId,
  validateUsername,
  combineValidationResults,
} from '../../utils/validation/index.js';

/**
 * Модуль операций с чатами Telegram
 */
export class ChatModule implements IChatModule {
  constructor(private readonly store: TelegramStore) {}

  async setChatUsername(
    userId: string,
    chatId: string | number,
    username: string
  ): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateUsername(username)
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return setChatUsernameWithCheck(userId, client, chatId, username);
  }

  async setChatPhoto(
    userId: string,
    chatId: string | number,
    photoPath: string
  ): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId),
      validateRequired(photoPath, 'photoPath')
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    return setChatPhotoWithCheck(userId, client, chatId, photoPath);
  }

  async getChatInfo(
    userId: string,
    chatId: string | number
  ): Promise<any> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateChatId(chatId)
    );

    if (!validation.isValid) {
      throw new Error(validation.errors.map(e => e.message).join('; '));
    }

    const client = getClient(userId, this.store.clients);
    if (!client) {
      throw new Error(`Клиент для пользователя ${userId} не найден`);
    }
    return getChatInfo(client, chatId);
  }
}
