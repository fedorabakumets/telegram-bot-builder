/**
 * @fileoverview Результат генерации QR-токена
 * @module server/telegram/types/auth/generate-qr-token-result
 */

/**
 * Результат операции генерации QR-токена с информацией о времени жизни
 */
export interface GenerateQRTokenResult {
  /** Успешность операции */
  success: boolean;
  /** Токен авторизации в base64 */
  token?: string;
  /** URL QR-кода для сканирования в Telegram */
  qrUrl?: string;
  /** Время жизни токена в секундах */
  expires?: number;
  /** Сообщение об ошибке */
  error?: string;
}
