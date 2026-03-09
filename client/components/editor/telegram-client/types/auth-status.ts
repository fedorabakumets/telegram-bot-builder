/**
 * @fileoverview Тип статуса авторизации Telegram Client API
 *
 * Определяет структуру данных для отображения состояния сессии пользователя.
 *
 * @module AuthStatus
 */

/**
 * Статус авторизации Client API
 */
export interface AuthStatus {
  /** Статус авторизации (true = пользователь вошёл) */
  isAuthenticated: boolean;
  /** Наличие API credentials (API ID и API Hash) */
  hasCredentials: boolean;
  /** Уникальный ID пользователя Telegram */
  userId?: number | string;
  /** Имя пользователя (username) */
  username?: string;
}
