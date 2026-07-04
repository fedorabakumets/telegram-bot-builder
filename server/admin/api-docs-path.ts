/**
 * @fileoverview Пути к сгенерированной Markdown-документации API
 * @module server/admin/api-docs-path
 */

import path from "path";

/** Имя индексного файла API docs */
export const API_DOCS_INDEX = "README.md";

/** Абсолютный путь к docs/api */
export function resolveApiDocsDir(): string {
  return path.join(process.cwd(), "docs", "api");
}

/**
 * Проверяет безопасность slug тега OpenAPI для имени файла.
 * @param slug - Имя тега, например projects или agent-tokens
 * @returns true, если slug допустим
 */
export function isSafeApiDocSlug(slug: string): boolean {
  return /^[a-z][a-z0-9_-]*$/.test(slug);
}
