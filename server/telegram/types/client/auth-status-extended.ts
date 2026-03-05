/**
 * @fileoverview Расширенный статус аутентификации
 * @module server/telegram/types/client/auth-status-extended
 */

/**
 * Расширенный статус аутентификации с дополнительной информацией
 */
export interface AuthStatusExtended {
  /** Пользователь авторизован */
  isAuthenticated: boolean;

  /** Номер телефона пользователя */
  phoneNumber?: string;

  /** ID пользователя */
  userId?: string;

  /** Требуется ввод кода подтверждения */
  needsCode?: boolean;

  /** Требуется ввод 2FA пароля */
  needsPassword?: boolean;

  /** Наличие API credentials */
  hasCredentials?: boolean;

  /** Username пользователя */
  username?: string;
}
