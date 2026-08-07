/**
 * @fileoverview Блок выбора режима входа на /admin/settings
 * @module server/admin/pages/sections/auth-login-mode-section
 */

import type { AuthLoginMode } from "../../../services/app-settings.service";

/** Параметры блока режима входа */
export interface AuthLoginModeSectionProps {
  /** Текущий режим */
  loginMode: AuthLoginMode;
}

/**
 * Рендерит radio-группу: dev-login vs Telegram Widget.
 * @param props - Текущий режим
 * @returns HTML фрагмент
 */
export function renderAuthLoginModeSection(
  props: AuthLoginModeSectionProps,
): string {
  const devChecked = props.loginMode === "dev_login" ? "checked" : "";
  const widgetChecked = props.loginMode === "telegram_widget" ? "checked" : "";

  return `
    <div class="auth-mode-block">
      <h3 class="form-card-title">Режим входа на сайте</h3>
      <p class="form-card-desc muted small">
        Выберите, как пользователи будут входить в редактор. Для локальной работы обычно достаточно dev-login.
      </p>
      <div class="auth-mode-options">
        <label class="auth-mode-option">
          <input type="radio" name="loginMode" value="dev_login" ${devChecked} />
          <span>
            <strong>Dev-login</strong> — ввод Telegram ID на странице входа.
            Для себя на localhost, без BotFather.
          </span>
        </label>
        <label class="auth-mode-option">
          <input type="radio" name="loginMode" value="telegram_widget" ${widgetChecked} />
          <span>
            <strong>Telegram Login Widget</strong> — кнопка «Войти через Telegram».
            Нужно перед деплоем, когда делитесь ссылкой с другими людьми.
          </span>
        </label>
      </div>
    </div>`;
}
