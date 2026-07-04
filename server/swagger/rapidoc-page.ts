/**
 * @fileoverview HTML-страница RapiDoc (CDN, без npm-зависимости)
 * @module server/swagger/rapidoc-page
 */

import type { Request, Response } from "express";

/** URL OpenAPI JSON spec */
const SPEC_URL = "/docs-json";

/**
 * Отдаёт HTML-страницу с RapiDoc viewer.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveRapidocPage(_req: Request, res: Response): void {
  res.type("html").send(`<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>API — RapiDoc</title>
  <script type="module" src="https://unpkg.com/rapidoc/dist/rapidoc-min.js"></script>
  <style>body { margin: 0; }</style>
</head>
<body>
  <rapi-doc
    spec-url="${SPEC_URL}"
    render-style="read"
    show-header="true"
    theme="dark"
    bg-color="#0f1117"
    text-color="#e6edf3"
    primary-color="#58a6ff"
    nav-bg-color="#161b22"
    nav-text-color="#e6edf3"
    nav-hover-bg-color="#21262d"
    nav-hover-text-color="#ffffff"
    nav-accent-color="#58a6ff"
  ></rapi-doc>
</body>
</html>`);
}
