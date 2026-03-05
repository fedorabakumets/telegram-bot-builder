/**
 * @fileoverview Утилита обработки ошибок QR-авторизации
 *
 * Предоставляет функции для проверки и форматирования ошибок,
 * возникающих при генерации QR-кода Telegram авторизации.
 *
 * @module qr-auth-error-handler
 */

/**
 * Проверяет, является ли ошибка ошибкой неверных API credentials
 *
 * @param {unknown} error - Объект ошибки
 * @returns {boolean} true, если ошибка связана с API_ID/API_HASH
 *
 * @example
 * ```typescript
 * if (isApiCredentialsError(error)) {
 *   return res.status(400).json({ error: 'Неверные credentials' });
 * }
 * ```
 */
export function isApiCredentialsError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error ? error.message : String(error);
  return errorMessage.includes('API_ID_INVALID') || 
         errorMessage.includes('API_ID') || 
         errorMessage.includes('API_HASH');
}

/**
 * Форматирует сообщение об ошибке для пользователя
 *
 * @param {unknown} error - Объект ошибки
 * @returns {string} Понятное сообщение об ошибке
 *
 * @example
 * ```typescript
 * const message = getFormattedQrError(error);
 * console.log(message); // "Неверные API credentials..."
 * ```
 */
export function getFormattedQrError(error: unknown): string {
  if (isApiCredentialsError(error)) {
    return 'Неверные API credentials. Получите новые API ID и API Hash на my.telegram.org и обновите настройки';
  }
  
  return 'Ошибка генерации QR-кода';
}
