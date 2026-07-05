/**
 * @fileoverview HTML-страницы «документация не найдена» для /admin/schema и /admin/api-docs
 * @module server/admin/pages/docs-missing-page
 */

import type { Response } from "express";
import { resolveApiDocsDir } from "../api-docs-path";
import { DB_DOCS_INDEX, resolveDbDocsDir } from "../db-docs-path";

/**
 * Общая HTML-оболочка для страницы с описанием проблемы и шагами исправления.
 * @param title - Заголовок страницы
 * @param intro - Краткое описание ошибки
 * @param expectedPath - Ожидаемый путь к индексному файлу
 * @param generateCmd - Команда локальной генерации
 * @param extraCauses - Дополнительные пункты для production
 * @returns HTML-документ
 */
function buildDocsMissingHtml(
  title: string,
  intro: string,
  expectedPath: string,
  generateCmd: string,
  extraCauses: string[],
): string {
  const causes = [
    `<strong>Локальная разработка</strong> — файлы ещё не сгенерированы. В корне репозитория: <code>${generateCmd}</code> (или <code>npm run docs</code> для всей документации).`,
    `<strong>Файлы не закоммичены</strong> — после генерации добавьте каталог в git или дождитесь workflow <code>sync-docs</code> в CI.`,
    ...extraCauses,
    `<strong>Устаревший деплой</strong> — на сервере крутится образ, собранный до появления docs в образе. Пересоберите и задеплойте сервис заново.`,
  ];

  const list = causes.map((item) => `<li>${item}</li>`).join("\n      ");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; min-height: 100vh; font-family: system-ui, sans-serif; background: #0f1117; color: #e6edf3; }
    main { max-width: 720px; margin: 0 auto; padding: 2rem 1.25rem 3rem; line-height: 1.55; }
    a { color: #58a6ff; text-decoration: none; }
    a:hover { text-decoration: underline; }
    h1 { margin: 0 0 .75rem; font-size: 1.35rem; }
    p { color: #8b949e; margin: 0 0 1rem; }
    code { background: #161b22; padding: .1rem .35rem; border-radius: 4px; font-size: .9em; }
    .path { display: block; margin: .5rem 0 1.25rem; padding: .75rem 1rem; background: #161b22; border: 1px solid #30363d; border-radius: 8px; font-size: .85rem; word-break: break-all; color: #e6edf3; }
    ul { margin: 0; padding-left: 1.2rem; color: #c9d1d9; }
    li { margin-bottom: .65rem; }
    li strong { color: #e6edf3; }
  </style>
</head>
<body>
  <main>
    <p><a href="/admin">← Admin</a></p>
    <h1>${title}</h1>
    <p>${intro}</p>
    <p>Ожидаемый файл на диске сервера:</p>
    <code class="path">${expectedPath}</code>
    <p>Возможные причины — не только отсутствие локальной генерации:</p>
    <ul>
      ${list}
    </ul>
  </main>
</body>
</html>`;
}

/**
 * Отдаёт 503 с подробным объяснением, почему нет docs/database.
 * @param res - Ответ Express
 * @returns void
 */
export function sendDbDocsMissingPage(res: Response): void {
  const expectedPath = `${resolveDbDocsDir()}/${DB_DOCS_INDEX}`;
  res.status(503).type("html").send(
    buildDocsMissingHtml(
      "Документация БД недоступна",
      "Сервер не нашёл сгенерированную документацию схемы (Drizzle → markdown). Это не обязательно ошибка только на вашей машине — чаще файлы не попали в production-образ или каталог пустой.",
      expectedPath,
      "npm run docs:db",
      [
        "<strong>Production / Docker</strong> — при сборке образа должен выполняться <code>npm run docs</code> и каталог <code>docs/database</code> копироваться в runtime-stage Dockerfile.",
        "<strong>Railway</strong> — проверьте <code>.railwayignore</code>: не должен исключать <code>docs/database</code> (допустимо <code>docs/*</code> с исключением <code>!docs/database</code>).",
      ],
    ),
  );
}

/**
 * Отдаёт 503 с подробным объяснением, почему нет docs/api.
 * @param res - Ответ Express
 * @returns void
 */
export function sendApiDocsMissingPage(res: Response): void {
  const expectedPath = `${resolveApiDocsDir()}/README.md`;
  res.status(503).type("html").send(
    buildDocsMissingHtml(
      "API-документация недоступна",
      "Сервер не нашёл сгенерированную markdown-документацию из OpenAPI. Причина может быть в деплое или в отсутствии файлов в образе, а не только в том, что вы не запускали генерацию локально.",
      expectedPath,
      "npm run docs:api",
      [
        "<strong>Production / Docker</strong> — при сборке образа нужен <code>npm run docs</code> (для API требуется <code>DATABASE_URL</code> на этапе build) и копирование <code>docs/api</code> в runtime.",
        "<strong>Railway</strong> — <code>.railwayignore</code> не должен вырезать <code>docs/api</code> из upload/образа.",
      ],
    ),
  );
}
