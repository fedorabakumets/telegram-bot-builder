/**
 * @fileoverview Менеджер операций Telegram клиента
 * @module server/telegram/services/client/telegram-operations-manager
 */

import { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import { GroupMemberOperations } from './group-member-operations.js';
import { ChatOperations } from './chat-operations.js';
import { AuthOperations } from './auth-operations.js';
import { disconnectWithCheck } from './disconnect-with-check.js';
import { saveSessionWithCheck } from './save-session-with-check.js';
import { restoreSessionWithCheck } from './restore-session-with-check.js';
import { initializeManager } from './initialize-manager.js';

/**
 * Фасад для всех операций Telegram клиента
 */
export class TelegramOperationsManager {
  group: GroupMemberOperations;
  chat: ChatOperations;
  auth: AuthOperations;

  private clients: Map<string, TelegramClient>;
  private sessions: Map<string, string>;
  private authStatus: Map<string, any>;

  constructor(
    clients: Map<string, TelegramClient>,
    sessions: Map<string, string>,
    authStatus: Map<string, any>
  ) {
    this.clients = clients;
    this.sessions = sessions;
    this.authStatus = authStatus;
    this.group = new GroupMemberOperations(clients);
    this.chat = new ChatOperations(clients);
    this.auth = new AuthOperations(clients, sessions, authStatus);
  }

  /**
   * Инициализация
   */
  async initialize(): Promise<void> {
    return initializeManager(this.clients, this.sessions, this.authStatus);
  }

  /**
   * Восстановить сессию
   */
  async restoreSession(userId: string): Promise<boolean> {
    return restoreSessionWithCheck(userId, this.clients, this.sessions, this.authStatus);
  }

  /**
   * Отключить клиента
   */
  async disconnect(userId: string): Promise<void> {
    const client = this.clients.get(userId);
    return disconnectWithCheck(userId, client, this.clients, this.sessions, this.authStatus);
  }

  /**
   * Сохранить сессию
   */
  async saveSession(userId: string): Promise<string | null> {
    const client = this.clients.get(userId) ?? null;
    return saveSessionWithCheck(userId, client);
  }
}
