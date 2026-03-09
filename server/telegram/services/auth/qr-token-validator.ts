/**
 * @fileoverview Валидация результата импорта QR-токена
 * @module server/telegram/services/auth/qr-token-validator
 */

import { Api } from 'telegram';

/**
 * Результат валидации токена
 */
export interface TokenValidationResult {
  /** Токен ещё не отсканирован */
  isPending: boolean;
  /** Токен успешно отсканирован */
  isSuccess: boolean;
  /** Произошла миграция на другой DC */
  needsMigration: boolean;
  /** DC ID для миграции */
  dcId?: number;
}

/**
 * Валидирует результат импорта QR-токена
 *
 * @param result - Результат от Telegram API
 * @returns Результат валидации
 */
export function validateTokenImportResult(
  result: unknown
): TokenValidationResult {
  // QR ещё не отсканирован
  if (result instanceof Api.auth.LoginToken) {
    return {
      isPending: true,
      isSuccess: false,
      needsMigration: false,
    };
  }

  // QR отсканирован успешно
  if (result instanceof Api.auth.LoginTokenSuccess) {
    return {
      isPending: false,
      isSuccess: true,
      needsMigration: false,
    };
  }

  // Требуется миграция
  if (result instanceof Api.auth.LoginTokenMigrateTo) {
    return {
      isPending: false,
      isSuccess: false,
      needsMigration: true,
      dcId: result.dcId,
    };
  }

  // Неизвестный статус
  return {
    isPending: false,
    isSuccess: false,
    needsMigration: false,
  };
}
