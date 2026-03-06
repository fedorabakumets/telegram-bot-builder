/**
 * @fileoverview Сервис для работы с Telegram Auth API
 *
 * Инкапсулирует все API вызовы для авторизации.
 *
 * @module TelegramAuthService
 */

import type { AuthStatus, ApiCredentials } from '../types';
import { createHttpClient } from './http-client';

/** Ответ генерации QR-кода */
export interface QrGenerateResponse {
  success: boolean;
  token?: string;
  qrUrl?: string;
  requiresPassword?: boolean;
  expires?: number;
  error?: string;
}

/** Ответ проверки QR-кода */
export interface QrCheckResponse {
  success: boolean;
  isAuthenticated?: boolean;
  needsPassword?: boolean;
}

/**
 * Сервис авторизации Telegram
 *
 * @example
 * ```typescript
 * const authService = new TelegramAuthService();
 * const status = await authService.getStatus();
 * ```
 */
export class TelegramAuthService {
  private http = createHttpClient();

  /**
   * Получить статус авторизации
   *
   * @returns {Promise<AuthStatus>} Статус авторизации
   */
  async getStatus(): Promise<AuthStatus> {
    return this.http.get<AuthStatus>('/api/telegram-auth/status');
  }

  /**
   * Сохранить API credentials
   *
   * @param {ApiCredentials} credentials - API ID и API Hash
   * @returns {Promise<void>}
   */
  async saveCredentials(credentials: ApiCredentials): Promise<void> {
    await this.http.post('/api/telegram-auth/save-credentials', credentials);
  }

  /**
   * Выйти из аккаунта
   *
   * @returns {Promise<void>}
   */
  async logout(): Promise<void> {
    await this.http.post('/api/telegram-auth/logout');
  }

  /**
   * Сбросить API credentials
   *
   * @returns {Promise<void>}
   */
  async resetCredentials(): Promise<void> {
    await this.http.post('/api/telegram-auth/reset-credentials');
  }

  /**
   * Сгенерировать QR-код
   *
   * @param {string} [password] - Пароль 2FA (опционально)
   * @returns {Promise<QrGenerateResponse>} Ответ с QR-токеном
   */
  async generateQr(password?: string): Promise<QrGenerateResponse> {
    return this.http.post<QrGenerateResponse>('/api/telegram-auth/qr-generate', { password });
  }

  /**
   * Проверить статус QR-кода
   *
   * @param {string} token - QR токен
   * @param {string} [password] - Пароль 2FA (опционально)
   * @returns {Promise<QrCheckResponse>} Статус проверки
   */
  async checkQr(token: string, password?: string): Promise<QrCheckResponse> {
    return this.http.post<QrCheckResponse>('/api/telegram-auth/qr-check', { token, password });
  }

  /**
   * Обновить QR-токен
   *
   * @returns {Promise<QrGenerateResponse>} Новый QR токен
   */
  async refreshQr(): Promise<QrGenerateResponse> {
    return this.http.post<QrGenerateResponse>('/api/telegram-auth/qr-refresh', {});
  }
}

/**
 * Создать экземпляр сервиса
 *
 * @returns {TelegramAuthService} Экземпляр сервиса
 */
export function createTelegramAuthService(): TelegramAuthService {
  return new TelegramAuthService();
}
