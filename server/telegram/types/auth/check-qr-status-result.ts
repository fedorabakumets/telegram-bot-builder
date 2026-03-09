/**
 * @fileoverview Результат проверки статуса QR-токена
 * @module server/telegram/types/auth/check-qr-status-result
 */

import { TelegramClient } from 'telegram';

/**
 * Результат операции проверки статуса QR-токена
 */
export interface CheckQRStatusResult {
  /** Успешность операции */
  success: boolean;
  /** Авторизован ли пользователь */
  isAuthenticated?: boolean;
  /** Сообщение об ошибке */
  error?: string;
  /** Требуется ли пароль двухфакторной аутентификации */
  needsPassword?: boolean;
  /** Строка сессии Telegram (после успешной авторизации) */
  sessionString?: string;
  /** Клиент Telegram для повторного использования */
  client?: TelegramClient;
}
