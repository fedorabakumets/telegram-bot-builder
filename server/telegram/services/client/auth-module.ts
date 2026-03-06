/**
 * @fileoverview Модуль авторизации Telegram клиента с валидацией
 * @module server/telegram/services/client/auth-module
 * @description Реализует операции авторизации через делегирование существующим функциям
 */

import type { TelegramClient } from 'telegram';
import type { TelegramClientConfig } from '../../types/client/telegram-client-config.js';
import type { AuthStatus } from '../../types/client/auth-status.js';
import type { IAuthModule } from '../../types/client/modules.js';
import { TelegramStore } from './telegram-store.js';
import { getAuthStatus } from './get-auth-status.js';
import { setCredentials } from './set-credentials.js';
import { createAndStoreClient } from './create-and-store-client.js';
import { getClient } from './get-client.js';
import { verifyPasswordWithValidation } from './verify-password-with-validation.js';
import { logoutWithCheck } from './logout-with-check.js';
import {
  validateApiId,
  validateApiHash,
  validateRequired,
  combineValidationResults,
  assertValid,
} from '../../utils/validation/index.js';

/**
 * Модуль авторизации для управления credentials и сессиями
 */
export class AuthModule implements IAuthModule {
  constructor(private readonly store: TelegramStore) {}

  async getStatus(userId: string): Promise<AuthStatus> {
    return getAuthStatus(userId);
  }

  async setCredentials(
    userId: string,
    apiId: string,
    apiHash: string
  ): Promise<{ success: boolean; error?: string }> {
    // Валидация входных данных
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateApiId(apiId),
      validateApiHash(apiHash)
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join('; '),
      };
    }

    return setCredentials(userId, apiId, apiHash);
  }

  async createClient(
    userId: string,
    config: TelegramClientConfig
  ): Promise<TelegramClient> {
    // Валидация конфигурации
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateRequired(config.apiId, 'apiId'),
      validateApiId(config.apiId),
      validateApiHash(config.apiHash)
    );

    assertValid(validation);

    return createAndStoreClient(userId, config, this.store.clients);
  }

  async getClient(userId: string): Promise<TelegramClient | null> {
    return getClient(userId, this.store.clients);
  }

  async verifyPassword(
    userId: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    // Валидация пароля
    const validation = combineValidationResults(
      validateRequired(userId, 'userId'),
      validateRequired(password, 'password')
    );

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join('; '),
      };
    }

    const client = this.store.clients.get(userId);
    const authStatus = this.store.authStatus.get(userId);
    return verifyPasswordWithValidation(
      userId,
      client,
      authStatus,
      password,
      this.store.sessions,
      this.store.authStatus
    );
  }

  async logout(
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    // Валидация userId
    const validation = validateRequired(userId, 'userId');

    if (!validation.isValid) {
      return {
        success: false,
        error: validation.errors.map(e => e.message).join('; '),
      };
    }

    const client = this.store.clients.get(userId);
    return logoutWithCheck(
      userId,
      client,
      this.store.clients,
      this.store.sessions,
      this.store.authStatus
    );
  }
}
