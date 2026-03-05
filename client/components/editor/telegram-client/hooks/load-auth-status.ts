/**
 * @fileoverview Функция загрузки статуса авторизации Telegram Client API
 *
 * @module loadAuthStatus
 */

import type { AuthStatus } from '../types';
import { createTelegramAuthService } from '../services/telegram-auth-service';
import { REQUEST_TIMEOUT, MAX_RETRY_ATTEMPTS } from '../constants';

/**
 * Загружает статус авторизации с сервера
 *
 * @returns {Promise<AuthStatus>} Статус авторизации
 *
 * @example
 * ```tsx
 * const status = await loadAuthStatus();
 * setAuthStatus(status);
 * ```
 */
export async function loadAuthStatus(): Promise<AuthStatus> {
  const authService = createTelegramAuthService();
  
  let lastError: Error | null = null;
  
  for (let i = 0; i < MAX_RETRY_ATTEMPTS; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
      
      const response = await fetch('/api/telegram-auth/status', {
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Неизвестная ошибка');
      
      if (i < MAX_RETRY_ATTEMPTS - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError ?? new Error('Не удалось загрузить статус');
}
