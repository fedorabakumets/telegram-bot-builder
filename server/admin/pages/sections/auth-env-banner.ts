/**
 * @fileoverview Баннер режима SKIP_AUTH / SETUP_WIZARD_STRICT на /admin/settings
 * @module server/admin/pages/sections/auth-env-banner
 */

import {
  isAuthSkipped,
  isPlatformAuthBypassed,
  isSetupWizardStrict,
} from "../../../services/app-settings.service";

/**
 * HTML баннер с текущим режимом авторизации и нужностью Telegram Login.
 * @param configured - Platform setup завершён (Telegram или bypass)
 * @returns HTML фрагмент
 */
export function renderAuthEnvBanner(configured: boolean): string {
  const skipAuth = isAuthSkipped();
  const strictWizard = isSetupWizardStrict();
  const bypassed = isPlatformAuthBypassed();

  const skipLine = skipAuth
    ? "<code>SKIP_AUTH</code> — dev-login по Telegram ID (виджет не нужен)."
    : "<code>SKIP_AUTH=false</code> — нужен Telegram Login Widget и настройки ниже.";

  const strictLine = strictWizard
    ? "<code>SETUP_WIZARD_STRICT=true</code> — проверка <code>app_settings</code> как в production (даже в dev)."
    : "<code>SETUP_WIZARD_STRICT</code> не задан — в dev setup можно не заполнять при SKIP_AUTH.";

  if (bypassed) {
    return `
    <div class="banner info">
      <strong>Режим разработки:</strong> Telegram Login сейчас <em>не блокирует</em> приложение.
      ${skipLine} ${strictLine}
      Настройки ниже — для production или когда отключите SKIP_AUTH.
    </div>`;
  }

  if (configured) {
    return `<div class="banner ok">Платформа настроена для входа через Telegram Login (${skipLine})</div>`;
  }

  return `
    <div class="banner warn">
      <strong>Требуется Telegram Login:</strong> ${skipLine}
      ${strictWizard ? strictLine : ""}
      Заполните форму ниже или включите dev-login (<code>SKIP_AUTH</code> без <code>false</code> в <code>.env</code>).
    </div>`;
}
