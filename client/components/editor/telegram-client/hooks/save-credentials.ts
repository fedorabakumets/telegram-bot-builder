/**
 * @fileoverview Функция сохранения API credentials Telegram Client API
 *
 * @module saveCredentials
 */

import { apiRequest } from '@/lib/queryClient';
import type { ApiCredentials } from '../types';

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
  const result = await apiRequest(
    'POST',
    '/api/telegram-auth/save-credentials',
    credentials
  );

  return {
    success: result.success,
    message: result.success
      ? 'API credentials сохранены'
      : 'Не удалось сохранить credentials',
  };
}
