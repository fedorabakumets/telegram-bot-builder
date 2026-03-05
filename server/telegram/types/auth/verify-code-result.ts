/**
 * @fileoverview Результат проверки кода подтверждения
 * @module server/telegram/types/auth/verify-code-result
 */

/**
 * Результат операции проверки кода подтверждения
 */
export interface VerifyCodeResult {
  /** Успешность операции */
  success: boolean;
  /** Сообщение об ошибке */
  error?: string;
  /** Требуется ли пароль двухфакторной аутентификации */
  needsPassword?: boolean;
}
