/**
 * @fileoverview Менеджер пользователей Telegram
 * @module server/telegram/services/client/user-manager
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';
import { TelegramOperationsManager } from './telegram-operations-manager.js';

/**
 * Менеджер пользователей Telegram
 */
export class UserManager {
  private readonly ops: TelegramOperationsManager;

  constructor(
    clients: Map<string, TelegramClient>,
    sessions: Map<string, string>,
    authStatus: Map<string, AuthStatus>
  ) {
    this.ops = new TelegramOperationsManager(clients, sessions, authStatus);
  }

  verifyPassword(userId: string, password: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.verifyPassword(userId, password);
  }

  logout(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.logout(userId);
  }

  getAuthStatus(userId: string): Promise<AuthStatus & Record<string, unknown>> {
    return this.ops.auth.getStatus(userId);
  }

  setCredentials(userId: string, apiId: string, apiHash: string): Promise<{ success: boolean; error?: string }> {
    return this.ops.auth.setCredentials(userId, apiId, apiHash);
  }

  createClient(userId: string, config: TelegramClientConfig): Promise<TelegramClient> {
    return this.ops.auth.createClient(userId, config);
  }

  getClient(userId: string): Promise<TelegramClient | null> {
    return this.ops.auth.getClient(userId);
  }
}
