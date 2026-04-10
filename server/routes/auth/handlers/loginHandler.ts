/**
 * @fileoverview Хендлер страницы входа
 *
 * Этот модуль предоставляет функцию для отображения
 * страницы входа с виджетом Telegram.
 *
 * @module auth/handlers/loginHandler
 */

import type { Request, Response } from "express";

/**
 * Обрабатывает запрос на страницу входа
 *
 * @function handleLogin
 * @param {Request} _req - Объект запроса (не используется)
 * @param {Response} res - Объект ответа
 * @returns {void}
 */
export function handleLogin(_req: Request, res: Response): void {
    const botUsername = process.env.VITE_TELEGRAM_BOT_USERNAME || 'botcraft_studio_bot';
    const cleanBotUsername = botUsername.replace('@', '');
    const isDev = process.env.NODE_ENV === 'development';

    const devForm = `
    <form id="devForm" style="margin-top:20px">
      <p style="color:#e67e22;font-size:12px;margin-bottom:16px">⚠️ Dev-режим: реальная авторизация не требуется</p>
      <input id="devId" type="number" placeholder="ID (любое число)" style="display:block;width:100%;margin-bottom:8px;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box" value="123456789" />
      <input id="devFirst" type="text" placeholder="Имя" style="display:block;width:100%;margin-bottom:8px;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box" value="Dev" />
      <input id="devUsername" type="text" placeholder="Username (без @)" style="display:block;width:100%;margin-bottom:16px;padding:8px;border:1px solid #ddd;border-radius:6px;box-sizing:border-box" value="devuser" />
      <button type="submit" style="width:100%;padding:10px;background:#0088cc;color:white;border:none;border-radius:6px;font-size:14px;cursor:pointer">Войти как dev-пользователь</button>
    </form>
    <script>
      document.getElementById('devForm').addEventListener('submit', function(e) {
        e.preventDefault();
        const user = {
          id: parseInt(document.getElementById('devId').value) || 123456789,
          first_name: document.getElementById('devFirst').value || 'Dev',
          username: document.getElementById('devUsername').value || 'devuser',
        };
        onTelegramAuth(user);
      });
    </script>`;

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
    ${isDev ? devForm : `<script async src="https://telegram.org/js/telegram-widget.js?22"
      data-telegram-login="${cleanBotUsername}"
      data-size="large"
      data-onauth="onTelegramAuth(user)"
      data-request-access="write">
    </script>`}
  </div>
  <script>
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
  </script>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
}
