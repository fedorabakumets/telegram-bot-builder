/**
 * @fileoverview Сервис для работы с Telegram Auth API
 *
 * Инкапсулирует все API вызовы для авторизации.
 *
 * @module TelegramAuthService
 */

import { apiRequest } from '@/lib/queryClient';
import type { AuthStatus, ApiCredentials } from '../types';

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
}

/** Сервис авторизации Telegram */
export class TelegramAuthService {
  async getStatus(): Promise<AuthStatus> {
    const response = await fetch('/api/telegram-auth/status');
    return response.json();
  }

  async saveCredentials(credentials: ApiCredentials): Promise<void> {
    await apiRequest('POST', '/api/telegram-auth/save-credentials', credentials);
  }

  async logout(): Promise<void> {
    await apiRequest('POST', '/api/telegram-auth/logout');
  }

  async resetCredentials(): Promise<void> {
    await apiRequest('POST', '/api/telegram-auth/reset-credentials');
  }

  async generateQr(password?: string): Promise<QrGenerateResponse> {
    return apiRequest('POST', '/api/telegram-auth/qr-generate', { password });
  }

  async checkQr(token: string, password?: string): Promise<QrCheckResponse> {
    return apiRequest('POST', '/api/telegram-auth/qr-check', { token, password });
  }

  async refreshQr(): Promise<QrGenerateResponse> {
    return apiRequest('POST', '/api/telegram-auth/qr-refresh', {});
  }
}

/** Создать экземпляр сервиса */
export function createTelegramAuthService(): TelegramAuthService {
  return new TelegramAuthService();
}
