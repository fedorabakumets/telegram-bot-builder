/**
 * @fileoverview HTML hub админ-панели после входа
 * @module server/admin/pages/hub-page
 */

import type { Request, Response } from "express";

/** Карточка раздела админки */
interface AdminSection {
  /** Заголовок */
  title: string;
  /** Описание */
  description: string;
  /** Ссылка */
  href: string;
}

/** Разделы админ-панели */
const ADMIN_SECTIONS: AdminSection[] = [
  {
    title: "Database Schema",
    description: "ER-диаграмма и описание таблиц из Drizzle-схемы (npm run docs:db).",
    href: "/admin/schema",
  },
  {
    title: "API Documentation",
    description: "OpenAPI spec: Swagger, Scalar, Redoc, RapiDoc.",
    href: "/admin/docs",
  },
  {
    title: "Healthcheck",
    description: "GET /api/health — статус БД, Redis, шаблонов.",
    href: "/api/health",
  },
  {
    title: "OpenAPI JSON",
    description: "Сырой spec для экспорта и генерации клиентов.",
    href: "/admin/openapi.json",
  },
];

/**
 * Отдаёт hub админ-панели.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveAdminHubPage(_req: Request, res: Response): void {
  const cards = ADMIN_SECTIONS.map(
    (s) => `
      <a class="card" href="${s.href}">
        <h2>${s.title}</h2>
        <p>${s.description}</p>
      </a>`,
  ).join("");

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
    .logout { color: #8b949e; text-decoration: none; font-size: .9rem; }
    .logout:hover { color: #f85149; }
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
    <div class="grid">${cards}</div>
  </div>
</body>
</html>`);
}
