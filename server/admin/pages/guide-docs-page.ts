/**
 * @fileoverview HTML-просмотр документов рантайма в /admin/guides/embed/:slug
 * @module server/admin/pages/guide-docs-page
 */

import fs from "fs";
import path from "path";
import type { Request, Response } from "express";
import { findRuntimeGuide, runtimeGuideAliases, type RuntimeGuide } from "../runtime-guides";

/**
 * Читает markdown только из каталога docs по пути из списка
 * @param file - Относительный путь из каталога
 * @returns Текст или null
 */
function readGuideFile(file: string): string | null {
  const root = path.resolve(process.cwd(), "docs");
  const full = path.resolve(root, file);
  if (full !== root && !full.startsWith(`${root}${path.sep}`)) return null;
  if (!fs.existsSync(full)) return null;
  return fs.readFileSync(full, "utf8");
}

/**
 * Экранирует строку для JSON внутри script
 * @param value - Исходный текст
 * @returns JSON-строка
 */
function toJsonScript(value: string): string {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}

/**
 * Экранирует заголовок для HTML
 * @param value - Текст
 * @returns Безопасная строка
 */
function escapeHtml(value: string): string {
  return value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
}

/**
 * Отдаёт страницу с marked, как справочник API
 * @param res - Ответ Express
 * @param guide - Документ из списка
 * @param markdown - Текст файла
 * @returns void
 */
function sendGuideHtml(res: Response, guide: RuntimeGuide, markdown: string): void {
  const title = escapeHtml(guide.title);
  const back = `/admin/runtime/${guide.group}`;
  res.type("html").send(`<!DOCTYPE html>
<html lang="ru"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${title}</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; background: #0f1117; color: #e6edf3; }
  .bar { display: flex; gap: 1rem; align-items: center; padding: .75rem 1.25rem; border-bottom: 1px solid #30363d; background: #161b22; }
  .bar a { color: #8b949e; text-decoration: none; font-size: .85rem; }
  .bar h1 { margin: 0; font-size: 1rem; font-weight: 600; }
  main { max-width: 900px; margin: 0 auto; padding: 1.25rem; line-height: 1.55; }
  main a { color: #58a6ff; } main code, main pre { background: #161b22; }
  main pre { padding: 1rem; border-radius: 8px; overflow: auto; }
  main code { padding: .1rem .35rem; border-radius: 4px; }
</style></head><body>
<div class="bar"><a href="${back}" target="_top">← К разделу</a><h1>${title}</h1></div>
<main id="content"></main>
<script id="md" type="application/json">${toJsonScript(markdown)}</script>
<script src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"></script>
<script>
  const aliases = ${JSON.stringify(runtimeGuideAliases())};
  const md = JSON.parse(document.getElementById("md").textContent);
  marked.use({ walkTokens(token) {
    if (token.type !== "link" || typeof token.href !== "string") return;
    const [pathPart, hash] = token.href.split("#");
    const base = pathPart.split("/").pop() || "";
    const slug = aliases[pathPart] || aliases[pathPart.replace(/^\\.\\//, "")] || aliases[base];
    if (slug) token.href = "/admin/guides/embed/" + slug + (hash ? "#" + hash : "");
  }});
  document.getElementById("content").innerHTML = marked.parse(md);
</script></body></html>`);
}

/**
 * Embed-страница документа для iframe панели
 * @param req - Запрос с slug
 * @param res - Ответ Express
 * @returns void
 */
export function serveRuntimeGuideEmbed(req: Request, res: Response): void {
  const guide = findRuntimeGuide(req.params.slug ?? "");
  if (!guide) {
    res.status(404).type("html").send("<p>Документ не найден</p>");
    return;
  }
  const markdown = readGuideFile(guide.file);
  if (!markdown) {
    res.status(404).type("html").send("<p>Файл документа не найден</p>");
    return;
  }
  sendGuideHtml(res, guide, markdown);
}
