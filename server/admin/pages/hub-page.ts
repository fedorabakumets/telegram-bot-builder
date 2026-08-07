/**
 * @fileoverview HTML hub админ-панели после входа
 * @module server/admin/pages/hub-page
 */

import type { Request, Response } from "express";
import { getAdminHubSections } from "../admin-hub-sections";
import { isConfigured, isPlatformAuthBypassed } from "../../services/app-settings.service";

/**
 * Собирает HTML карточек разделов admin hub.
 * @returns HTML фрагмент ссылок-карточек
 */
function renderAdminHubCards(): string {
  return getAdminHubSections()
    .map((section) => {
      const externalAttrs = section.external ? ' target="_blank" rel="noopener noreferrer"' : "";
      return `
      <a class="card" href="${section.href}"${externalAttrs}>
        <h2>${section.title}</h2>
        <p>${section.description}</p>
      </a>`;
    })
    .join("");
}

/**
 * Отдаёт hub админ-панели.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 */
export async function serveAdminHubPage(_req: Request, res: Response): Promise<void> {
  const configured = await isConfigured();
  const setupBanner = isPlatformAuthBypassed()
    ? ""
    : configured
      ? ""
      : `<div class="banner warn">Сначала <a href="/admin/settings">настройте Telegram Login</a> или включите SKIP_AUTH в .env для dev-login.</div>`;

  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Admin — Telegram Bot Builder</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; background: #0f1117; color: #e6edf3; padding: 2rem; }
    .wrap { max-width: 960px; margin: 0 auto; }
    .head { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 2rem; flex-wrap: wrap; }
    h1 { margin: 0; font-size: 1.75rem; }
    .logout { color: #8b949e; text-decoration: none; font-size: .9rem; background: none; border: none; cursor: pointer; font-family: inherit; }
    .logout:hover { color: #f85149; }
    .banner { padding: .75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; font-size: .9rem; background: #3d1300; border: 1px solid #d29922; }
    .banner a { color: #58a6ff; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card {
      display: block; padding: 1.25rem; border-radius: 12px; background: #161b22;
      border: 1px solid #30363d; color: inherit; text-decoration: none;
      transition: border-color .15s, transform .15s;
    }
    .card:hover { border-color: #58a6ff; transform: translateY(-2px); }
    .card h2 { margin: 0; font-size: 1.1rem; }
    .card p { margin: .75rem 0 0; color: #8b949e; font-size: .92rem; line-height: 1.45; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="head">
      <h1>Admin</h1>
      <form method="post" action="/admin/api/logout"><button class="logout" type="submit">Выйти</button></form>
    </div>
    ${setupBanner}
    <div class="grid">${renderAdminHubCards()}</div>
  </div>
</body>
</html>`);
}
