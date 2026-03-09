/**
 * @fileoverview Результат генерации QR-кода
 * @module server/telegram/types/auth/generate-qr-result
 */

/**
 * Результат операции генерации QR-кода для авторизации
 */
export interface GenerateQRResult {
  /** Успешность операции */
  success: boolean;
  /** URL QR-кода для сканирования в Telegram */
  qrUrl?: string;
  /** Токен авторизации в base64 */
  token?: string;
  /** Хеш кода телефона */
  phoneCodeHash?: string;
  /** Сообщение об ошибке */
  error?: string;
}
