/**
 * @fileoverview HTML-просмотр сгенерированной документации БД в /admin/schema
 * @module server/admin/pages/schema-docs-page
 */

import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { simplifyMermaidErInMarkdown } from "../../../lib/db-docs/simplify-mermaid-er";
import { DB_DOCS_INDEX, isSafeDbDocTableName, resolveDbDocsDir } from "../db-docs-path";

/**
 * Читает markdown-файл документации таблицы или индекс.
 * @param fileName - Имя файла, например README.md или bot_projects.md
 * @returns Содержимое или null, если файла нет
 */
function readDbDocFile(fileName: string): string | null {
  const fullPath = path.join(resolveDbDocsDir(), fileName);
  if (!fs.existsSync(fullPath)) return null;
  return fs.readFileSync(fullPath, "utf8");
}

/**
 * Экранирует строку для безопасной вставки в JSON внутри script.
 * @param value - Исходная строка
 * @returns JSON-строка
 */
function toJsonScript(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Отдаёт HTML-оболочку с рендером markdown (marked + mermaid).
 * @param res - Ответ Express
 * @param title - Заголовок страницы
 * @param markdown - Содержимое markdown
 * @param backHref - Ссылка «назад»
 * @returns void
 */
function sendSchemaDocsHtml(res: Response, title: string, markdown: string, backHref: string): void {
  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} — Database Schema</title>
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
    .hint { color: #8b949e; font-size: .85rem; margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #30363d; }
  </style>
</head>
<body>
  <div class="bar">
    <a href="${backHref}">← Admin</a>
    <h1>${title}</h1>
    <a href="/admin/schema">Все таблицы</a>
  </div>
  <main id="content"></main>
  <script id="md" type="application/json">${toJsonScript(markdown)}</script>
  <script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <script>
    (async () => {
      const md = JSON.parse(document.getElementById("md").textContent);
      marked.use({
        walkTokens(token) {
          if (token.type === "link" && /^\\.\\/([a-z][a-z0-9_]*)\\.md$/.test(token.href)) {
            token.href = "/admin/schema/" + token.href.slice(2, -3);
          }
        },
      });
      mermaid.initialize({ startOnLoad: false, theme: "dark", securityLevel: "loose" });
      const root = document.getElementById("content");
      root.innerHTML = marked.parse(md);
      root.querySelectorAll("pre code.language-mermaid").forEach((el) => {
        const parent = el.parentElement;
        if (!parent) return;
        const div = document.createElement("div");
        div.className = "mermaid";
        div.textContent = el.textContent || "";
        parent.replaceWith(div);
      });
      await mermaid.run({ querySelector: ".mermaid" });
    })();
  </script>
</body>
</html>`);
}

/**
 * Индекс документации БД (README с ER-диаграммой).
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveSchemaDocsIndex(_req: Request, res: Response): void {
  const markdown = readDbDocFile(DB_DOCS_INDEX);
  if (!markdown) {
    res.status(503).type("html").send(
      "<p>Документация БД не найдена. Выполните: <code>npm run docs:db</code></p>",
    );
    return;
  }
  sendSchemaDocsHtml(res, "Database Schema", simplifyMermaidErInMarkdown(markdown), "/admin");
}

/**
 * Страница одной таблицы из docs/database/{name}.md
 * @param req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveSchemaDocsTable(req: Request, res: Response): void {
  const tableName = req.params.tableName ?? "";
  if (!isSafeDbDocTableName(tableName)) {
    res.status(400).send("Некорректное имя таблицы");
    return;
  }

  const markdown = readDbDocFile(`${tableName}.md`);
  if (!markdown) {
    res.status(404).type("html").send(`<p>Таблица <code>${tableName}</code> не найдена в docs/database/</p>`);
    return;
  }

  sendSchemaDocsHtml(res, tableName, markdown, "/admin/schema");
}
