/**
 * @fileoverview API credentials пользователя
 * @module server/telegram/types/auth/user-credentials
 */

/**
 * Учетные данные API Telegram пользователя
 */
export interface UserCredentials {
  /** API ID приложения */
  apiId?: string;
  /** API Hash приложения */
  apiHash?: string;
}
