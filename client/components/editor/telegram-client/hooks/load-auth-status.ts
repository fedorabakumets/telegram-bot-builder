/**
 * @fileoverview Функция загрузки статуса авторизации Telegram Client API
 *
 * @module loadAuthStatus
 */

import type { AuthStatus } from '../types';

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
  const response = await fetch('/api/telegram-auth/status');
  const status = await response.json();
  return status as AuthStatus;
}
