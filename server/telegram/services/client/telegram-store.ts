/**
 * @fileoverview Централизованное хранилище состояния Telegram клиентов
 * @module server/telegram/services/client/telegram-store
 * @description Управляет клиентами, сессиями и статусами авторизации
 */

import type { TelegramClient } from 'telegram';
import type { AuthStatus } from '../../types/client/auth-status.js';

/**
 * Централизованное хранилище состояния для всех модулей Telegram
 */
export class TelegramStore {
  /** Мапа клиентов по ID пользователя */
  readonly clients: Map<string, TelegramClient>;
  /** Мапа строк сессий по ID пользователя */
  readonly sessions: Map<string, string>;
  /** Мапа статусов авторизации по ID пользователя */
  readonly authStatus: Map<string, AuthStatus>;

  constructor() {
    this.clients = new Map<string, TelegramClient>();
    this.sessions = new Map<string, string>();
    this.authStatus = new Map<string, AuthStatus>();
  }

  /**
   * Очищает все данные хранилища
   */
  clear(): void {
    this.clients.clear();
    this.sessions.clear();
    this.authStatus.clear();
  }
}
