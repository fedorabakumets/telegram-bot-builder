/**
 * @fileoverview Результат проверки 2FA пароля
 * @module server/telegram/types/auth/verify-password-result
 */

/**
 * Результат операции проверки пароля двухфакторной аутентификации
 */
export interface VerifyPasswordResult {
  /** Успешность операции */
  success: boolean;
  /** Сообщение об ошибке */
  error?: string;
}
