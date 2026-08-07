/**
 * @fileoverview HTML страница /admin/settings — настройки приложения
 * @module server/admin/pages/settings-page
 */

import type { Request, Response } from "express";
import {
  getAuthLoginMode,
  getSetting,
  isConfigured,
  resolveBotUsername,
} from "../../services/app-settings.service";
import { renderAuthEnvBanner } from "./sections/auth-env-banner";
import {
  renderTelegramSettingsSection,
} from "./sections/telegram-settings-section";

/**
 * Отдаёт страницу настроек приложения (секции по провайдерам).
 * @param req - Запрос Express
 * @param res - Ответ Express
 */
export async function serveAdminSettingsPage(
  req: Request,
  res: Response,
): Promise<void> {
  const clientId = (await getSetting("telegram_client_id")) ?? "";
  const botUsername = (await resolveBotUsername()) ?? "";
  const clientSecret = await getSetting("telegram_client_secret");
  const botToken = await getSetting("telegram_bot_token");
  const configured = await isConfigured();
  const loginMode = await getAuthLoginMode();

  const errorMessage =
    typeof req.query.error === "string" ? req.query.error : undefined;
  const saved = req.query.saved === "1";

  const telegramSection = renderTelegramSettingsSection({
    clientId,
    botUsername,
    clientSecretConfigured: Boolean(clientSecret?.trim()),
    botTokenConfigured: Boolean(botToken?.trim()),
    errorMessage,
    saved,
    loginMode,
  });

  const envBanner = await renderAuthEnvBanner(configured);

  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Настройки приложения — Admin</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; background: #0f1117; color: #e6edf3; padding: 2rem; }
    .wrap { max-width: 72rem; margin: 0 auto; }
    .head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    h1 { margin: 0; font-size: 1.5rem; }
    .back { color: #58a6ff; text-decoration: none; font-size: .9rem; }
    .back:hover { text-decoration: underline; }
    .section { padding: 1.25rem; border-radius: 12px; background: #161b22; border: 1px solid #30363d; margin-bottom: 1rem; }
    .section h2 { margin: 0 0 .5rem; font-size: 1.15rem; }
    .section-desc { margin: 0 0 1rem; line-height: 1.45; }
    .setup-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      align-items: start;
    }
    @media (min-width: 768px) {
      .setup-grid { grid-template-columns: 1fr 1fr; }
    }
    .form-card {
      padding: 1.25rem; border-radius: 12px;
      background: #0d1117; border: 1px solid #30363d;
    }
    .form-card-title { margin: 0; font-size: 1rem; }
    .form-card-desc { margin: 0.35rem 0 0.75rem; }
    .form-divider { border: none; border-top: 1px solid #30363d; margin: 1.25rem 0; }
    .auth-mode-block { margin-bottom: 0.5rem; }
    .auth-mode-options { display: flex; flex-direction: column; gap: 0.75rem; margin-top: 0.75rem; }
    .auth-mode-option {
      display: flex; gap: 0.65rem; align-items: flex-start; cursor: pointer;
      padding: 0.75rem; border-radius: 8px; border: 1px solid #30363d; background: #161b22;
    }
    .auth-mode-option input { margin-top: 0.2rem; flex-shrink: 0; }
    .auth-mode-option span { font-size: 0.88rem; line-height: 1.45; color: #8b949e; }
    .auth-mode-option strong { color: #e6edf3; }
    .setup-col-instructions .instruction-block {
      margin: 0; padding: 1.25rem;
    }
    .muted { color: #8b949e; font-size: .9rem; }
    .small { font-size: .85rem; }
    .instruction-block {
      padding: 1rem; border-radius: 12px;
      background: #0d1117; border: 1px solid #30363d;
    }
    .instruction-title { margin: 0 0 1rem; font-size: 1rem; color: #e6edf3; }
    .steps-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .step { display: flex; gap: 0.75rem; align-items: flex-start; }
    .step-num {
      flex-shrink: 0; width: 1.5rem; height: 1.5rem; border-radius: 999px;
      border: 1px solid #58a6ff; color: #58a6ff; font-size: 0.75rem; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
    }
    .step-text { margin: 0; color: #8b949e; font-size: 0.9rem; line-height: 1.55; flex: 1; }
    .step-text code { color: #e6edf3; font-size: 0.85rem; }
    .shot { margin: 0.5rem 0 0.75rem 2.25rem; }
    .shot img {
      width: 100%; max-width: 100%; height: auto; border-radius: 8px;
      border: 1px solid #30363d; display: block; background: #161b22;
    }
    .note { margin-top: 1rem; line-height: 1.5; }
    .field-hint { margin: 0.35rem 0 0; }
    .fields label { display: block; font-size: .85rem; margin: 1rem 0 .35rem; color: #8b949e; }
    .fields input {
      width: 100%; padding: .65rem .75rem; border-radius: 8px; border: 1px solid #30363d;
      background: #0d1117; color: #e6edf3; font-size: 1rem;
    }
    .btn-primary {
      margin-top: 1.25rem; padding: .7rem 1.25rem; border: none; border-radius: 8px;
      background: #238636; color: #fff; font-size: 1rem; cursor: pointer;
    }
    .btn-primary:hover { background: #2ea043; }
    .banner { padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1rem; font-size: .9rem; }
    .banner.ok { background: #033a16; border: 1px solid #238636; }
    .banner.warn { background: #3d1300; border: 1px solid #d29922; }
    .banner.err { background: #3d0f0f; border: 1px solid #f85149; }
    .banner.info { background: #0d4190; border: 1px solid #388bfd; }
    .banner a { color: #58a6ff; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>Настройки приложения</h1>
      <a class="back" href="/admin">← Admin hub</a>
    </div>
    ${envBanner}
    ${telegramSection}
  </div>
  <script>
    (function () {
      const form = document.getElementById('settings-form');
      const clientId = document.getElementById('clientId');

      function syncTelegramRequired() {
        const mode = form.querySelector('input[name="loginMode"]:checked')?.value;
        if (clientId) clientId.required = mode === 'telegram_widget';
      }

      form.querySelectorAll('input[name="loginMode"]').forEach((radio) => {
        radio.addEventListener('change', syncTelegramRequired);
      });
      syncTelegramRequired();

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const loginMode = fd.get('loginMode');
        const body = { auth: { loginMode } };

        const clientIdVal = String(fd.get('clientId') ?? '').trim();
        if (loginMode === 'telegram_widget' || clientIdVal) {
          body.telegram = {
            clientId: fd.get('clientId'),
            clientSecret: fd.get('clientSecret') || undefined,
            botToken: fd.get('botToken') || undefined,
            botUsername: fd.get('botUsername') || undefined,
          };
        }

        const res = await fetch('/admin/api/app-settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (res.ok) {
          window.location.href = '/admin/settings?saved=1';
          return;
        }
        const data = await res.json().catch(() => ({}));
        const err = data.error || 'Ошибка сохранения';
        window.location.href = '/admin/settings?error=' + encodeURIComponent(err);
      });
    })();
  </script>
</body>
</html>`);
}
