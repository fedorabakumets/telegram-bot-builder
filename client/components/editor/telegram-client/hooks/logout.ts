/**
 * @fileoverview Функция выхода из аккаунта Telegram Client API
 *
 * @module logout
 */

import { createTelegramAuthService } from '../services/telegram-auth-service';

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
  const authService = createTelegramAuthService();
  
  try {
    await authService.logout();
    return {
      success: true,
      message: 'Вы успешно вышли из аккаунта',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Не удалось выполнить выход',
    };
  }
}
