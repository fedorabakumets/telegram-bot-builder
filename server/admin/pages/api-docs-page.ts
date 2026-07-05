/**
 * @fileoverview HTML-просмотр docs/api в /admin/api-docs
 * @module server/admin/pages/api-docs-page
 */

import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { API_DOCS_INDEX, isSafeApiDocSlug, resolveApiDocsDir } from "../api-docs-path";
import { sendApiDocsMissingPage } from "./docs-missing-page";

/**
 * Читает markdown-файл API-документации.
 * @param fileName - Имя файла, например README.md или projects.md
 * @returns Содержимое или null
 */
function readApiDocFile(fileName: string): string | null {
  const fullPath = path.join(resolveApiDocsDir(), fileName);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

/**
 * Экранирует строку для JSON внутри script.
 * @param value - Исходная строка
 * @returns JSON-строка
 */
function toJsonScript(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Отдаёт HTML с рендером markdown через marked.
 * @param res - Ответ Express
 * @param title - Заголовок
 * @param markdown - Markdown-текст
 * @param backHref - Ссылка назад
 * @returns void
 */
function sendApiDocsHtml(res: Response, title: string, markdown: string, backHref: string): void {
  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — API Reference</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; background: #0f1117; color: #e6edf3; }
    .bar { display: flex; gap: 1rem; align-items: center; padding: 1rem 1.5rem; border-bottom: 1px solid #30363d; background: #161b22; flex-wrap: wrap; }
    .bar a { color: #58a6ff; text-decoration: none; font-size: .9rem; }
    .bar a:hover { text-decoration: underline; }
    .bar h1 { margin: 0; font-size: 1.1rem; flex: 1; }
    main { max-width: 1100px; margin: 0 auto; padding: 1.5rem; line-height: 1.55; }
    main a { color: #58a6ff; }
    main table { width: 100%; border-collapse: collapse; margin: 1rem 0; font-size: .9rem; }
    main th, main td { border: 1px solid #30363d; padding: .45rem .6rem; text-align: left; }
    main th { background: #161b22; }
    main code { background: #161b22; padding: .1rem .35rem; border-radius: 4px; font-size: .85em; }
    main pre { background: #161b22; padding: 1rem; border-radius: 8px; overflow: auto; }
  </style>
</head>
<body>
  <div class="bar">
    <a href="${backHref}">← Admin</a>
    <h1>${title}</h1>
    <a href="/admin/api-docs">Все разделы</a>
  </div>
  <main id="content"></main>
  <script id="md" type="application/json">${toJsonScript(markdown)}</script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script>
    (async () => {
      const md = JSON.parse(document.getElementById("md").textContent);
      marked.use({
        walkTokens(token) {
          if (token.type === "link" && /^\\.\\/([a-z][a-z0-9_-]*)\\.md$/.test(token.href)) {
            token.href = "/admin/api-docs/" + token.href.slice(2, -3);
          }
        },
      });
      document.getElementById("content").innerHTML = marked.parse(md);
    })();
  </script>
</body>
</html>`);
}

/**
 * Индекс API Reference (README).
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveApiDocsIndex(_req: Request, res: Response): void {
  const markdown = readApiDocFile(API_DOCS_INDEX);
  if (!markdown) {
    sendApiDocsMissingPage(res);
    return;
  }
  sendApiDocsHtml(res, "API Reference", markdown, "/admin");
}

/**
 * Страница тега OpenAPI из docs/api/{slug}.md
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveApiDocsTag(req: Request, res: Response): void {
  const slug = req.params.slug ?? "";
  if (!isSafeApiDocSlug(slug)) {
    res.status(400).send("Некорректное имя раздела");
    return;
  }

  const markdown = readApiDocFile(`${slug}.md`);
  if (!markdown) {
    res.status(404).type("html").send(`<p>Раздел <code>${slug}</code> не найден в docs/api/</p>`);
    return;
  }

  sendApiDocsHtml(res, slug, markdown, "/admin/api-docs");
}
