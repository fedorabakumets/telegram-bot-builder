/**
 * @fileoverview Баннер режима входа на /admin/settings
 * @module server/admin/pages/sections/auth-env-banner
 */

import { getAuthLoginMode, isConfigured } from "../../../services/app-settings.service";

/**
 * HTML баннер с текущим режимом входа.
 * @param configured - Platform setup завершён
 * @returns HTML фрагмент
 */
export async function renderAuthEnvBanner(configured: boolean): Promise<string> {
  const loginMode = await getAuthLoginMode();

  if (loginMode === "dev_login") {
    return `
    <div class="banner info">
      <strong>Сейчас: dev-login</strong> — вход по Telegram ID, виджет и поля BotFather не нужны.
      Перед деплоем и ссылкой для друзей выберите ниже «Telegram Login Widget» и заполните данные бота.
    </div>`;
  }

  if (configured) {
    return `
    <div class="banner ok">
      <strong>Сейчас: Telegram Login Widget</strong> — вход через кнопку Telegram на сайте.
    </div>`;
  }

  return `
    <div class="banner warn">
      <strong>Нужна настройка Telegram Login</strong> — заполните данные BotFather ниже.
      Или переключите на dev-login для локальной работы без виджета.
    </div>`;
}
