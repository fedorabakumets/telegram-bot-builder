/**
 * @fileoverview HTML-инструкция BotFather с скриншотами для /admin/settings
 * @module server/admin/pages/sections/telegram-settings-instructions
 */

/** Один шаг инструкции */
interface InstructionStep {
  /** Номер шага */
  num: number;
  /** Текст шага (может содержать безопасный HTML) */
  html: string;
}

/** Шаги до скриншотов */
const STEPS: InstructionStep[] = [
  { num: 1, html: "Открой мини-приложение @BotFather в Telegram" },
  { num: 2, html: "My Bots → выбери нужного бота" },
  { num: 3, html: "Нажми Login Widget (см. скриншот ниже)" },
  { num: 4, html: "Нажми «Switch to OpenID Connect Login» (см. скриншот ниже)" },
  { num: 5, html: "В диалоге подтверждения нажми Confirm (см. скриншот ниже)" },
  {
    num: 6,
    html:
      "Добавь Redirect URI и Trusted Origin — URL сайта. Для <code>npm run dev</code> можно пропустить (см. скриншот ниже)",
  },
  {
    num: 7,
    html:
      "Скопируй <strong>Client ID</strong> и <strong>Client Secret</strong> — отдельные поля OIDC, <em>не</em> bot token (см. скриншот ниже)",
  },
  {
    num: 8,
    html: "<strong>Bot Username</strong> — имя бота без @ (или подставится из Bot Token)",
  },
  {
    num: 9,
    html:
      "<strong>Bot Token</strong> — через <code>/token</code> в @BotFather. Только для автовхода внутри Telegram Mini App (<code>initData</code>). Для виджета в браузере не нужен.",
  },
];

/** Скриншоты после указанных шагов */
const SHOTS_AFTER_STEP: Record<number, { src: string; alt: string }> = {
  3: {
    src: "/assets/images/botfather-login-widget.png",
    alt: "Login Widget в меню BotFather",
  },
  4: {
    src: "/assets/images/botfather-switch-to-oidc.png",
    alt: "Switch to OpenID Connect Login",
  },
  5: {
    src: "/assets/images/botfather-confirm-oidc.png",
    alt: "Подтверждение OIDC",
  },
  6: {
    src: "/assets/images/botfather-redirect-uris.png",
    alt: "Redirect URIs и Trusted Origins",
  },
  7: {
    src: "/assets/images/botfather-client-id-secret.png",
    alt: "Client ID и Client Secret",
  },
};

/**
 * Рендерит один шаг с номером.
 * @param step - Шаг инструкции
 * @returns HTML фрагмент
 */
function renderStep(step: InstructionStep): string {
  const shot = SHOTS_AFTER_STEP[step.num];
  const shotHtml = shot
    ? `<figure class="shot"><img src="${shot.src}" alt="${shot.alt}" loading="lazy" /></figure>`
    : "";
  return `
    <div class="step">
      <span class="step-num">${step.num}</span>
      <p class="step-text">${step.html}</p>
    </div>
    ${shotHtml}`;
}

/**
 * Возвращает HTML блока инструкции (всегда развёрнут, со скриншотами).
 * @returns HTML фрагмент
 */
export function renderTelegramSettingsInstructions(): string {
  const stepsHtml = STEPS.map(renderStep).join("");

  return `
    <div class="instruction-block">
      <h3 class="instruction-title">Как получить данные в BotFather</h3>
      <div class="steps-list">${stepsHtml}</div>
      <p class="muted small note">
        <strong>Вход в браузере:</strong> Client ID + Client Secret (OIDC, <code>id_token</code>).
        <strong>Внутри Telegram Mini App:</strong> Bot Token (<code>initData</code>).
        Client Secret и Bot Token — разные значения.
      </p>
      <p class="muted small">
        <a href="https://core.telegram.org/bots/telegram-login" target="_blank" rel="noopener noreferrer">core.telegram.org/bots/telegram-login</a>
      </p>
    </div>`;
}
