/**
 * @fileoverview Результат операции с credentials
 * @module server/telegram/types/auth/credentials-result
 */

/**
 * Результат операции сохранения/загрузки API credentials
 */
export interface CredentialsResult {
  /** Успешность операции */
  success: boolean;
  /** Сообщение об ошибке */
  error?: string;
}
