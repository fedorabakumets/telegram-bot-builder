/**
 * @fileoverview Функция сохранения API credentials Telegram Client API
 *
 * @module saveCredentials
 */

import type { ApiCredentials } from '../types';
import { createTelegramAuthService } from '../services/telegram-auth-service';

/**
 * Результат операции сохранения
 */
export interface SaveCredentialsResult {
  /** Успешно ли сохранение */
  success: boolean;
  /** Сообщение о результате */
  message: string;
}

/**
 * Сохраняет API credentials на сервере
 *
 * @param credentials - API ID и API Hash
 * @returns {Promise<SaveCredentialsResult>} Результат операции
 *
 * @example
 * ```tsx
 * const result = await saveCredentials({ apiId: '123', apiHash: 'abc' });
 * if (result.success) {
 *   toast({ title: 'Успешно' });
 * }
 * ```
 */
export async function saveCredentials(
  credentials: ApiCredentials
): Promise<SaveCredentialsResult> {
  const authService = createTelegramAuthService();
  
  try {
    await authService.saveCredentials(credentials);
    return {
      success: true,
      message: 'API credentials сохранены',
    };
  } catch (error) {
    return {
      success: false,
      message: 'Не удалось сохранить credentials',
    };
  }
}
