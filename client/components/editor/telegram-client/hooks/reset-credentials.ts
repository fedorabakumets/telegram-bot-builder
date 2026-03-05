/**
 * @fileoverview Функция сброса API credentials Telegram Client API
 *
 * @module resetCredentials
 */

import { createTelegramAuthService } from '../services/telegram-auth-service';

/**
 * Результат операции сброса
 */
export interface ResetCredentialsResult {
  /** Успешно ли выполнение */
  success: boolean;
  /** Сообщение о результате */
  message: string;
}

/**
 * Сбрасывает API credentials на сервере
 *
 * @returns {Promise<ResetCredentialsResult>} Результат операции
 *
 * @example
 * ```tsx
 * const result = await resetCredentials();
 * if (result.success) {
 *   setApiId('');
 *   setApiHash('');
 * }
 * ```
 */
export async function resetCredentials(): Promise<ResetCredentialsResult> {
  const authService = createTelegramAuthService();
  
  try {
    await authService.resetCredentials();
    return {
      success: true,
      message: 'API credentials удалены. Введите новые данные',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Не удалось сбросить credentials',
    };
  }
}
