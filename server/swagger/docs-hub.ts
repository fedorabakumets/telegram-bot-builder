/**
 * @fileoverview HTML-страница выбора UI для OpenAPI документации
 * @module server/swagger/docs-hub
 */

import type { Request, Response } from "express";

/** Вариант UI документации API */
interface DocsUiOption {
  /** Заголовок карточки */
  title: string;
  /** Краткое описание */
  description: string;
  /** Путь к UI */
  href: string;
  /** CSS-класс бейджа */
  badge: string;
}

/** Доступные UI для просмотра OpenAPI spec */
const DOCS_UI_OPTIONS: DocsUiOption[] = [
  {
    title: "Swagger UI",
    description: "Классика: Try it out, Authorize, отправка запросов из браузера.",
    href: "/docs/swagger",
    badge: "interactive",
  },
  {
    title: "Scalar",
    description: "Современный UI: поиск, тёмная тема, удобный Try it out.",
    href: "/docs/scalar",
    badge: "interactive",
  },
  {
    title: "Redoc",
    description: "Read-only документация: трёхколоночный layout, удобно читать схемы.",
    href: "/docs/redoc",
    badge: "read-only",
  },
  {
    title: "RapiDoc",
    description: "Компактный read-only viewer с боковой навигацией.",
    href: "/docs/rapidoc",
    badge: "read-only",
  },
];

/**
 * Рендерит HTML-страницу выбора UI документации.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveDocsHub(_req: Request, res: Response): void {
  const cards = DOCS_UI_OPTIONS.map(
    (ui) => `
      <a class="card" href="${ui.href}">
        <div class="card-head">
          <h2>${ui.title}</h2>
          <span class="badge ${ui.badge}">${ui.badge}</span>
        </div>
        <p>${ui.description}</p>
      </a>`,
  ).join("");

  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Telegram Bot Builder API — Docs</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; font-family: system-ui, sans-serif;
      background: #0f1117; color: #e6edf3; padding: 2rem;
    }
    .wrap { max-width: 960px; margin: 0 auto; }
    h1 { margin: 0 0 .5rem; font-size: 1.75rem; }
    .sub { color: #8b949e; margin-bottom: 2rem; }
    .sub a { color: #58a6ff; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .card {
      display: block; padding: 1.25rem; border-radius: 12px;
      background: #161b22; border: 1px solid #30363d; color: inherit; text-decoration: none;
      transition: border-color .15s, transform .15s;
    }
    .card:hover { border-color: #58a6ff; transform: translateY(-2px); }
    .card-head { display: flex; align-items: center; justify-content: space-between; gap: .5rem; }
    .card h2 { margin: 0; font-size: 1.1rem; }
    .card p { margin: .75rem 0 0; color: #8b949e; font-size: .92rem; line-height: 1.45; }
    .badge {
      font-size: .68rem; text-transform: uppercase; letter-spacing: .04em;
      padding: .2rem .45rem; border-radius: 999px; white-space: nowrap;
    }
    .badge.interactive { background: #23863633; color: #3fb950; }
    .badge.read-only { background: #8957e533; color: #bc8cff; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>Telegram Bot Builder API</h1>
    <p class="sub">
      Один OpenAPI spec — несколько UI на выбор.
      JSON: <a href="/docs-json">/docs-json</a>
    </p>
    <div class="grid">${cards}</div>
  </div>
</body>
</html>`);
}
