/**
 * @fileoverview Менеджер сессий Telegram
 * @module server/telegram/services/client/session-manager
 */

import type { TelegramClient } from 'telegram';
import type { AuthStatus } from '../../types/client/auth-status.js';
import { TelegramOperationsManager } from './telegram-operations-manager.js';

/**
 * Менеджер сессий Telegram
 */
export class SessionManager {
  private readonly clients: Map<string, TelegramClient>;
  private readonly ops: TelegramOperationsManager;

  constructor(
    clients: Map<string, TelegramClient>,
    sessions: Map<string, string>,
    authStatus: Map<string, AuthStatus>
  ) {
    this.clients = clients;
    this.ops = new TelegramOperationsManager(clients, sessions, authStatus);
  }

  getClients(): Map<string, TelegramClient> {
    return this.clients;
  }

  initialize(): Promise<void> {
    return this.ops.initialize();
  }

  restoreSession(userId: string): Promise<boolean> {
    return this.ops.restoreSession(userId);
  }

  disconnect(userId: string): Promise<void> {
    return this.ops.disconnect(userId);
  }

  saveSession(userId: string): Promise<string | null> {
    return this.ops.saveSession(userId);
  }
}
