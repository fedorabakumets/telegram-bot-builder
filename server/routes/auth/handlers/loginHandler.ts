/**
 * @fileoverview Хендлер страницы входа
 *
 * Отображает страницу входа с виджетом Telegram.
 * Читает Client ID и Bot Username из app_settings (БД),
 * с fallback на process.env для обратной совместимости.
 *
 * @module auth/handlers/loginHandler
 */

import type { Request, Response } from "express";
import { getSetting } from "../../../services/app-settings.service";
import { isSkipAuthEnabled } from "../utils/isSkipAuthEnabled";

/**
 * HTML + JS формы dev-входа (вызывается только при SKIP_AUTH).
 * Сама бьёт в POST /api/auth/dev-login, затем уведомляет opener или редиректит.
 * @returns Фрагмент HTML
 */
function buildDevLoginFormHtml(): string {
  return `
    <form id="devForm" style="margin-top:20px" method="post" action="/api/auth/dev-login">
      <p style="color:#e67e22;font-size:12px;margin-bottom:16px">⚠️ Dev-режим: введите ваш Telegram ID</p>
      <input id="devId" name="id" type="number" required placeholder="Ваш Telegram ID"
        style="display:block;width:100%;margin-bottom:16px;padding:10px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box;font-size:16px" />
      <button id="devSubmit" type="submit"
        style="width:100%;padding:10px;background:#0088cc;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer">Войти</button>
      <p id="devStatus" style="margin-top:12px;font-size:12px;color:#666;min-height:1.2em"></p>
    </form>
    <p style="margin-top:12px;font-size:11px;color:#999">Узнать свой ID: напишите <a href="https://t.me/userinfobot" target="_blank">@userinfobot</a> в Telegram</p>
    <script>
      (function () {
        var form = document.getElementById('devForm');
        var statusEl = document.getElementById('devStatus');
        var submitBtn = document.getElementById('devSubmit');
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          var id = parseInt(document.getElementById('devId').value, 10);
          if (!id) {
            statusEl.textContent = 'Введите Telegram ID';
            statusEl.style.color = '#c0392b';
            return;
          }
          submitBtn.disabled = true;
          statusEl.style.color = '#666';
          statusEl.textContent = 'Вход…';
          fetch('/api/auth/dev-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ id: id, firstName: 'Dev', username: 'dev_' + id })
          })
            .then(function (r) { return r.json().then(function (data) { return { ok: r.ok, data: data }; }); })
            .then(function (result) {
              if (!result.data || !result.data.success || !result.data.user) {
                throw new Error((result.data && result.data.error) || 'Ошибка входа');
              }
              var user = result.data.user;
              var mapped = {
                id: user.id,
                firstName: user.firstName || user.first_name || 'Dev',
                lastName: user.lastName || user.last_name,
                username: user.username,
                photoUrl: user.photoUrl || user.photo_url
              };
              statusEl.style.color = '#27ae60';
              statusEl.textContent = 'Успешно';
              if (window.opener && !window.opener.closed) {
                window.opener.postMessage(
                  { type: 'telegram-auth', user: mapped, sessionReady: true },
                  window.location.origin
                );
                setTimeout(function () { window.close(); }, 400);
              } else {
                window.location.href = '/';
              }
            })
            .catch(function (err) {
              submitBtn.disabled = false;
              statusEl.style.color = '#c0392b';
              statusEl.textContent = err.message || 'Ошибка входа';
            });
        });
      })();
    </script>`;
}

/**
 * Обрабатывает запрос на страницу входа
 *
 * @param _req - Объект запроса (не используется)
 * @param res - Объект ответа
 * @returns Promise<void>
 */
export async function handleLogin(_req: Request, res: Response): Promise<void> {
  const clientId = (await getSetting("telegram_client_id")) || "0";
  const isDev = isSkipAuthEnabled();

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Вход - BotCraft Studio</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      min-width: 300px;
    }
    h1 { margin: 0 0 10px 0; color: #333; font-size: 24px; }
    p { margin: 0 0 30px 0; color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Вход в BotCraft Studio</h1>
    <p>Используйте свой аккаунт Telegram для входа</p>
    ${
      isDev
        ? buildDevLoginFormHtml()
        : `<script src="https://telegram.org/js/telegram-login.js"></script>
    <button id="tgLoginBtn" style="padding:10px 24px;background:#0088cc;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer">Войти через Telegram</button>
    <script>
      Telegram.Login.init({
        client_id: ${clientId},
        request_access: ['write'],
      }, function(user) { if (user) onTelegramAuth(user); });
      document.getElementById('tgLoginBtn').addEventListener('click', function() { Telegram.Login.open(); });
      window.addEventListener('load', function() { Telegram.Login.open(); });
    </script>`
    }
  </div>
  ${
    isDev
      ? ""
      : `<script>
    function onTelegramAuth(user) {
      const mapped = {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        username: user.username,
        photoUrl: user.photo_url,
      };
      if (window.opener) {
        window.opener.postMessage({ type: 'telegram-auth', user: mapped }, window.location.origin);
        setTimeout(() => window.close(), 500);
      }
    }
  </script>`
  }
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
}
