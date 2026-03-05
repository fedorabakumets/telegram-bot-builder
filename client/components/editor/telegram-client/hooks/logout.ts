/**
 * @fileoverview Функция выхода из аккаунта Telegram Client API
 *
 * @module logout
 */

import { apiRequest } from '@/lib/queryClient';

/**
 * Результат операции выхода
 */
export interface LogoutResult {
  /** Успешно ли выполнение */
  success: boolean;
  /** Сообщение о результате */
  message: string;
}

/**
 * Выполняет выход из аккаунта Client API
 *
 * @returns {Promise<LogoutResult>} Результат операции
 *
 * @example
 * ```tsx
 * const result = await logout();
 * if (result.success) {
 *   toast({ title: 'Выполнен выход' });
 * }
 * ```
 */
export async function logout(): Promise<LogoutResult> {
  await apiRequest('POST', '/api/telegram-auth/logout');

  return {
    success: true,
    message: 'Вы успешно вышли из аккаунта',
  };
}
