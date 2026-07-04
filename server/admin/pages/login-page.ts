/**
 * @fileoverview HTML-страница входа в /admin
 * @module server/admin/pages/login-page
 */

import type { Request, Response } from "express";

/**
 * Отдаёт форму входа по ADMIN_API_KEY.
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveAdminLoginPage(req: Request, res: Response): void {
  const error = req.query.error === "1";
  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — вход</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: system-ui, sans-serif; background: #0f1117; color: #e6edf3;
    }
    .card {
      width: min(400px, 92vw); padding: 2rem; border-radius: 12px;
      background: #161b22; border: 1px solid #30363d;
    }
    h1 { margin: 0 0 .5rem; font-size: 1.35rem; }
    p { color: #8b949e; font-size: .9rem; margin: 0 0 1.5rem; }
    label { display: block; font-size: .85rem; margin-bottom: .35rem; color: #8b949e; }
    input {
      width: 100%; padding: .65rem .75rem; border-radius: 8px; border: 1px solid #30363d;
      background: #0d1117; color: #e6edf3; font-size: 1rem;
    }
    button {
      margin-top: 1rem; width: 100%; padding: .7rem; border: none; border-radius: 8px;
      background: #238636; color: #fff; font-size: 1rem; cursor: pointer;
    }
    button:hover { background: #2ea043; }
    .err { color: #f85149; font-size: .85rem; margin-bottom: 1rem; }
  </style>
</head>
<body>
  <form class="card" method="post" action="/admin/api/login">
    <h1>Admin</h1>
    <p>Панель оператора платформы. Введите ADMIN_API_KEY.</p>
    ${error ? '<div class="err">Неверный ключ доступа</div>' : ""}
    <label for="key">Ключ доступа</label>
    <input id="key" name="key" type="password" autocomplete="current-password" required autofocus />
    <button type="submit">Войти</button>
  </form>
</body>
</html>`);
}
