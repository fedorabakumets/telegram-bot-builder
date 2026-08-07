/**
 * @fileoverview Сохранение режима входа (dev-login vs Telegram Widget)
 * @module server/admin/handlers/auth-settings-save
 */

import {
  AUTH_LOGIN_MODES,
  refreshAuthLoginCache,
  setSetting,
  type AuthLoginMode,
} from "../../services/app-settings.service";

/** Результат сохранения режима входа */
export interface AuthSettingsSaveResult {
  /** Успех операции */
  success: boolean;
  /** Режим после сохранения */
  loginMode?: AuthLoginMode;
  /** Текст ошибки */
  error?: string;
}

/**
 * Сохраняет режим входа в app_settings.
 * @param loginMode - dev_login или telegram_widget
 * @returns Результат операции
 */
export async function saveAuthLoginMode(
  loginMode: string | undefined,
): Promise<AuthSettingsSaveResult> {
  if (!loginMode || !AUTH_LOGIN_MODES.includes(loginMode as AuthLoginMode)) {
    return {
      success: false,
      error: "auth.loginMode: dev_login или telegram_widget",
    };
  }

  await setSetting("auth_login_mode", loginMode);
  await refreshAuthLoginCache();

  return { success: true, loginMode: loginMode as AuthLoginMode };
}
