/**
 * @fileoverview Модуль управления сессиями Telegram клиента с валидацией
 * @module server/telegram/services/client/session-module
 * @description Реализует операции инициализации, восстановления и сохранения сессий
 */

import type { ISessionModule } from '../../types/client/modules.js';
import { TelegramStore } from './telegram-store.js';
import { initializeManager } from './initialize-manager.js';
import { restoreSessionWithCheck } from './restore-session-with-check.js';
import { saveSessionWithCheck } from './save-session-with-check.js';
import { disconnectWithCheck } from './disconnect-with-check.js';
import { validateRequired } from '../../utils/validation/index.js';

/**
 * Модуль управления сессиями Telegram клиентов
 */
export class SessionModule implements ISessionModule {
  constructor(private readonly store: TelegramStore) {}

  async initialize(): Promise<void> {
    return initializeManager(
      this.store.clients,
      this.store.sessions,
      this.store.authStatus
    );
  }

  async restoreSession(userId: string): Promise<boolean> {
    // Валидация userId
    const validation = validateRequired(userId, 'userId');
    if (!validation.isValid) {
      console.error('Ошибка валидации restoreSession:', validation.errors[0].message);
      return false;
    }

    return restoreSessionWithCheck(
      userId,
      this.store.clients,
      this.store.sessions,
      this.store.authStatus
    );
  }

  async saveSession(userId: string): Promise<string | null> {
    // Валидация userId
    const validation = validateRequired(userId, 'userId');
    if (!validation.isValid) {
      console.error('Ошибка валидации saveSession:', validation.errors[0].message);
      return null;
    }

    return saveSessionWithCheck(userId, this.store.clients.get(userId) ?? null);
  }

  async disconnect(userId: string): Promise<void> {
    // Валидация userId
    const validation = validateRequired(userId, 'userId');
    if (!validation.isValid) {
      console.error('Ошибка валидации disconnect:', validation.errors[0].message);
      return;
    }

    const client = this.store.clients.get(userId);
    return disconnectWithCheck(
      userId,
      client,
      this.store.clients,
      this.store.sessions,
      this.store.authStatus
    );
  }
}
