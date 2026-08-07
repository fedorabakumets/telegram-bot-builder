/**
 * @fileoverview HTML-секция настроек Telegram для /admin/settings
 * @module server/admin/pages/sections/telegram-settings-section
 */

import { renderTelegramSettingsInstructions } from "./telegram-settings-instructions";

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
  /** Telegram Login обязателен для работы платформы */
  telegramRequired: boolean;
  /** SKIP_AUTH активен (dev-login) */
  skipAuthEnabled: boolean;
}

/**
 * Генерирует HTML формы Telegram (левая колонка).
 * @param props - Текущие значения и флаги
 * @returns HTML фрагмент формы
 */
function renderTelegramSettingsForm(props: TelegramSectionProps): string {
  const required = props.telegramRequired;
  const reqLabel = required
    ? '<span class="muted">(обязательно)</span>'
    : '<span class="muted">(для production)</span>';
  const secretReq = required
    ? '<span class="muted">(обязательно при первой настройке)</span>'
    : '<span class="muted">(если SKIP_AUTH=false)</span>';
  const clientIdRequired = required ? "required" : "";
  const secretHint = props.clientSecretConfigured
    ? "Задан — оставьте пустым, чтобы не менять"
    : "Из BotFather → Web Login (не bot token!)";
  const tokenHint = props.botTokenConfigured
    ? "Задан — оставьте пустым, чтобы не менять"
    : "Опционально — Mini App в Telegram, не для виджета";

  return `
    <div class="form-card">
      <h3 class="form-card-title">Данные бота</h3>
      <p class="form-card-desc muted small">
        ${props.skipAuthEnabled
          ? "Опционально при SKIP_AUTH — для production задайте SKIP_AUTH=false и заполните поля."
          : "Заполни поля из BotFather (SKIP_AUTH=false — виджет обязателен)."}
      </p>
      <form id="settings-form" class="fields">
        <label for="clientId">Client ID ${reqLabel}</label>
        <input id="clientId" name="clientId" type="text" ${clientIdRequired} value="${escapeAttr(props.clientId)}" />

        <label for="clientSecret">Client Secret ${secretReq}</label>
        <input id="clientSecret" name="clientSecret" type="password" autocomplete="new-password" placeholder="${escapeAttr(secretHint)}" />

        <label for="botUsername">Bot Username <span class="muted">(опционально)</span></label>
        <input id="botUsername" name="botUsername" type="text" value="${escapeAttr(props.botUsername)}" placeholder="без @ — или подставится из Bot Token" />

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
    ? `<div class="banner ok">Настройка сохранена. <a href="/projects">Перейти к входу</a></div>`
    : "";

  return `
  <section class="section" id="telegram">
    <h2>Telegram Login (OIDC)</h2>
    <p class="muted section-desc">
      Нужен при <code>SKIP_AUTH=false</code> (вход через виджет). При <code>SKIP_AUTH</code> (dev-login по ID) — опционально.
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
