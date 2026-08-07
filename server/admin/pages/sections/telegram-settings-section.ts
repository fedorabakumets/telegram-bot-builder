/**
 * @fileoverview HTML-секция настроек Telegram для /admin/settings
 * @module server/admin/pages/sections/telegram-settings-section
 */

import { renderTelegramSettingsInstructions } from "./telegram-settings-instructions";
import { renderAuthLoginModeSection } from "./auth-login-mode-section";
import type { AuthLoginMode } from "../../../services/app-settings.service";

/** Параметры отрисовки секции Telegram */
export interface TelegramSectionProps {
  /** Client ID для value в форме */
  clientId: string;
  /** Username бота для value в форме */
  botUsername: string;
  /** Client secret уже задан */
  clientSecretConfigured: boolean;
  /** Bot token уже задан */
  botTokenConfigured: boolean;
  /** Сообщение об ошибке сохранения */
  errorMessage?: string;
  /** Успешное сохранение */
  saved?: boolean;
  /** Режим входа из admin */
  loginMode: AuthLoginMode;
}

/**
 * Генерирует HTML формы Telegram (левая колонка).
 * @param props - Текущие значения и флаги
 * @returns HTML фрагмент формы
 */
function renderTelegramSettingsForm(props: TelegramSectionProps): string {
  const widgetMode = props.loginMode === "telegram_widget";
  const reqLabel = widgetMode
    ? '<span class="muted">(обязательно)</span>'
    : '<span class="muted">(опционально)</span>';
  const secretReq = widgetMode
    ? '<span class="muted">(обязательно при первой настройке)</span>'
    : '<span class="muted">(опционально)</span>';
  const clientIdRequired = widgetMode ? "required" : "";
  const secretHint = props.clientSecretConfigured
    ? "Задан — оставьте пустым, чтобы не менять"
    : "Из BotFather → Web Login (не bot token!)";
  const tokenHint = props.botTokenConfigured
    ? "Задан — оставьте пустым, чтобы не менять"
    : "Опционально — Mini App в Telegram, не для виджета";

  const clientIdPlaceholder = props.clientId
    ? ""
    : "Числовой Client ID из BotFather → Web Login";
  const usernamePlaceholder = props.botUsername
    ? ""
    : "my_bot — без @, или из Bot Token";

  return `
    <div class="form-card">
      <form id="settings-form" class="fields">
        ${renderAuthLoginModeSection({ loginMode: props.loginMode })}
        <hr class="form-divider" />
        <h3 class="form-card-title">Данные Telegram (для виджета)</h3>
        <p class="form-card-desc muted small">
          ${props.loginMode === "dev_login"
            ? "Не обязательно при dev-login. Заполните перед переключением на Telegram Widget."
            : "Обязательно: Client ID, Secret и username из BotFather."}
        </p>
        <label for="clientId">Client ID ${reqLabel}</label>
        <input id="clientId" name="clientId" type="text" ${clientIdRequired} value="${escapeAttr(props.clientId)}" placeholder="${escapeAttr(clientIdPlaceholder)}" />
        <p class="field-hint muted small">Скопируй из @BotFather → Login Widget → OpenID (см. инструкцию справа).</p>

        <label for="clientSecret">Client Secret ${secretReq}</label>
        <input id="clientSecret" name="clientSecret" type="password" autocomplete="new-password" placeholder="${escapeAttr(secretHint)}" />

        <label for="botUsername">Bot Username <span class="muted">(опционально)</span></label>
        <input id="botUsername" name="botUsername" type="text" value="${escapeAttr(props.botUsername)}" placeholder="${escapeAttr(usernamePlaceholder)}" />

        <label for="botToken">Bot Token <span class="muted">(опционально)</span></label>
        <input id="botToken" name="botToken" type="password" autocomplete="new-password" placeholder="${escapeAttr(tokenHint)}" />
        <p class="field-hint muted small">Не путать с Client Secret. Для Mini App (<code>initData</code>) и username. Виджет в браузере — без токена.</p>

        <button type="submit" class="btn-primary">Сохранить</button>
      </form>
    </div>`;
}

/**
 * Генерирует секцию Telegram: форма слева, инструкция справа.
 * @param props - Текущие значения и флаги
 * @returns HTML фрагмент
 */
export function renderTelegramSettingsSection(
  props: TelegramSectionProps,
): string {
  const errorBlock = props.errorMessage
    ? `<div class="banner err">${escapeHtml(props.errorMessage)}</div>`
    : "";
  const savedBlock = props.saved
    ? `<div class="banner ok">Настройка сохранена. <a href="/">Перейти к входу</a></div>`
    : "";

  return `
  <section class="section" id="telegram">
    <h2>Telegram Login (OIDC)</h2>
    <p class="muted section-desc">
      Настройка входа через Telegram. <strong>Локально для себя</strong> — можно пропустить (dev-login).
      <strong>Нужна перед production</strong>, если выкатываете сайт и делитесь ссылкой с друзьями или клиентами.
    </p>
    ${errorBlock}
    ${savedBlock}
    <div class="setup-grid">
      <div class="setup-col setup-col-form">
        ${renderTelegramSettingsForm(props)}
      </div>
      <div class="setup-col setup-col-instructions">
        ${renderTelegramSettingsInstructions()}
      </div>
    </div>
  </section>`;
}

/**
 * Экранирует HTML в тексте
 * @param value - Строка
 * @returns Безопасный HTML
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Экранирует значение для HTML-атрибутов
 * @param value - Строка
 * @returns Безопасный атрибут
 */
function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, "&#39;");
}
