/**
 * @fileoverview Операции авторизации
 * @module server/telegram/services/client/auth-operations
 */

import { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import { getAuthStatus } from './get-auth-status.js';
import { setCredentials } from './set-credentials.js';
import { createAndStoreClient } from './create-and-store-client.js';
import { getClient } from './get-client.js';
import { verifyPasswordWithValidation } from './verify-password-with-validation.js';
import { logoutWithCheck } from './logout-with-check.js';

/**
 * Сервис для выполнения операций авторизации
 */
export class AuthOperations {
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
  }

  /**
   * Получить статус авторизации
   */
  async getStatus(userId: string) {
    return getAuthStatus(userId);
  }

  /**
   * Установить credentials
   */
  async setCredentials(userId: string, apiId: string, apiHash: string) {
    return setCredentials(userId, apiId, apiHash);
  }

  /**
   * Создать клиента
   */
  async createClient(userId: string, config: TelegramClientConfig) {
    return createAndStoreClient(userId, config, this.clients);
  }

  /**
   * Получить клиента
   */
  getClient(userId: string) {
    return getClient(userId, this.clients);
  }

  /**
   * Проверить 2FA пароль
   */
  async verifyPassword(userId: string, password: string) {
    const client = this.clients.get(userId);
    const authStatus = this.authStatus.get(userId);
    return verifyPasswordWithValidation(userId, client, authStatus, password, this.sessions, this.authStatus);
  }

  /**
   * Выйти
   */
  async logout(userId: string) {
    const client = this.clients.get(userId);
    return logoutWithCheck(userId, client, this.clients, this.sessions, this.authStatus);
  }
}
