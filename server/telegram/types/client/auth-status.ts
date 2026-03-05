/**
 * @fileoverview Статус аутентификации пользователя
 * @module server/telegram/types/client/auth-status
 */

/**
 * Статус аутентификации пользователя в Telegram
 */
export interface AuthStatus {
  /** Пользователь авторизован */
  isAuthenticated: boolean;

  /** Номер телефона пользователя */
  phoneNumber?: string | undefined;

  /** ID пользователя */
  userId?: string | undefined;

  /** Требуется ввод кода подтверждения */
  needsCode?: boolean | undefined;

  /** Требуется ввод 2FA пароля */
  needsPassword?: boolean | undefined;
}
