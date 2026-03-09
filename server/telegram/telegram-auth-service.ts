/**
 * @fileoverview Сервис авторизации Telegram Client API
 *
 * Предоставляет оркестрацию сервисов авторизации:
 * - QR-код авторизация (через сканирование в приложении)
 * - 2FA поддержка
 * - Управление credentials
 *
 * @module telegram-auth-service
 */

import type { TelegramClient } from 'telegram';
import type { VerifyPasswordResult } from './types/auth/verify-password-result.js';
import type { CredentialsResult } from './types/auth/credentials-result.js';
import type { UserCredentials } from './types/auth/user-credentials.js';
import { saveCredentials, loadCredentials } from './utils/auth/index.js';
import { verifyPassword, generateQRToken, checkQRStatus, generateQR } from './services/auth/index.js';

/**
 * Сервис авторизации Telegram
 */
class TelegramAuthService {






  /**
   * Проверяет пароль двухфакторной аутентификации (2FA)
   *
   * @param {TelegramClient} client - Подключенный клиент Telegram
   * @param {string} password - Пароль 2FA
   * @returns {Promise<VerifyPasswordResult>} Результат проверки
   *
   * @example
   * ```typescript
   * const result = await verifyPassword(client, 'mySecretPassword');
   * if (result.success) {
   *   console.log('2FA авторизация успешна');
   * }
   * ```
   */
  async verifyPassword(
    client: TelegramClient,
    password: string
  ): Promise<VerifyPasswordResult> {
    return verifyPassword(client, password);
  }

  /**
   * Генерирует QR-код для авторизации
   *
   * @param {string} apiId - API ID приложения
   * @param {string} apiHash - API Hash приложения
   * @returns {Promise<{success: boolean; qrUrl?: string; token?: string; error?: string}>}
   *
   * @example
   * ```typescript
   * const result = await generateQR('19827705', '52359acb...');
   * if (result.success) {
   *   console.log('QR URL:', result.qrUrl);
   * }
   * ```
   */
  async generateQR(
    apiId: string,
    apiHash: string
  ): Promise<{ success: boolean; qrUrl?: string; token?: string; error?: string }> {
    return generateQR(apiId, apiHash);
  }

  /**
   * Сохраняет API credentials в базу данных
   *
   * @param {string} userId - ID пользователя
   * @param {string} apiId - API ID
   * @param {string} apiHash - API Hash
   * @returns {Promise<{success: boolean; error?: string}>}
   */
  async saveCredentials(
    userId: string,
    apiId: string,
    apiHash: string
  ): Promise<CredentialsResult> {
    return saveCredentials(userId, apiId, apiHash);
  }

  /**
   * Загружает credentials из базы данных
   *
   * @param {string} userId - ID пользователя
   * @returns {Promise<{apiId?: string; apiHash?: string} | null>}
   */
  async loadCredentials(
    userId: string
  ): Promise<UserCredentials | null> {
    return loadCredentials(userId);
  }

  /**
   * Генерирует новый QR-токен (обновляет существующий)
   *
   * @param {TelegramClient} client - Подключенный клиент
   * @param {string} apiId - API ID
   * @param {string} apiHash - API Hash
   * @returns {Promise<{success: boolean; token?: string; qrUrl?: string; expires?: number; error?: string}>}
   */
  async generateQRToken(
    client: TelegramClient,
    apiId: string,
    apiHash: string
  ): Promise<{ success: boolean; token?: string; qrUrl?: string; expires?: number; error?: string }> {
    return generateQRToken(client, apiId, apiHash);
  }

  /**
   * Проверяет статус QR-токена (отсканирован ли он)
   *
   * ВНИМАНИЕ: Этот метод НЕ должен вызываться часто, так как importLoginToken
   * помечает токен как использованный!
   *
   * @param {string} apiId - API ID приложения
   * @param {string} apiHash - API Hash приложения
   * @param {string} token - Токен QR-кода
   * @param {string} [password] - Пароль 2FA (если требуется)
   * @param {TelegramClient} [existingClient] - Существующий клиент для повторного использования
   * @returns {Promise<{success: boolean; isAuthenticated?: boolean; error?: string; needsPassword?: boolean; sessionString?: string; client?: TelegramClient}>}
   *
   * @example
   * ```typescript
   * const result = await checkQRStatus('19827705', '52359acb...', 'token123');
   * if (result.success && result.isAuthenticated) {
   *   console.log('QR отсканирован!');
   * } else if (result.needsPassword) {
   *   console.log('Требуется 2FA пароль');
   * }
   * ```
   */
  async checkQRStatus(
    apiId: string,
    apiHash: string,
    token: string,
    password?: string,
    existingClient?: TelegramClient
  ): Promise<{
    success: boolean;
    isAuthenticated?: boolean;
    error?: string;
    needsPassword?: boolean;
    sessionString?: string;
    client?: TelegramClient;
  }> {
    return checkQRStatus(apiId, apiHash, token, password, existingClient);
  }
}

/**
 * Экспорт единственного экземпляра сервиса
 */
export const telegramAuthService = new TelegramAuthService();
