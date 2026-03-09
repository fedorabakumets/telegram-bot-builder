/**
 * @fileoverview Форматирование QR-токена для логирования
 * @module server/telegram/services/auth/qr-token-formatter
 */

/** Длина превью токена */
const TOKEN_PREVIEW_LENGTH = 20;

/**
 * Создаёт превью токена для логирования
 *
 * @param token - Токен в base64
 * @returns Превью токена (первые 20 символов + ...)
 */
export function formatTokenPreview(token: string): string {
  return token.substring(0, TOKEN_PREVIEW_LENGTH) + '...';
}

/**
 * Форматирует сообщение о проверке токена
 *
 * @param token - Токен в base64
 * @returns Сообщение для логирования
 */
export function formatTokenCheckMessage(token: string): string {
  const preview = formatTokenPreview(token);
  return `🔍 Проверка токена: ${preview}`;
}

/**
 * Форматирует сообщение об успешном сканировании
 *
 * @param sessionString - Строка сессии
 * @returns Сообщение для логирования
 */
export function formatScanSuccessMessage(sessionString: string): string {
  return `✅ QR отсканирован!\n📦 Session String: ${sessionString}`;
}
