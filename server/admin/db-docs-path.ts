/**
 * @fileoverview Путь к сгенерированной документации БД (drizzle-docs-generator)
 * @module server/admin/db-docs-path
 */

import path from "path";

/** Имя файла индекса документации */
export const DB_DOCS_INDEX = "README.md";

/** Абсолютный путь к каталогу docs/database */
export function resolveDbDocsDir(): string {
  return path.join(process.cwd(), "docs", "database");
}

/**
 * Проверяет, что имя таблицы безопасно для чтения файла.
 * @param name - Имя таблицы (snake_case)
 * @returns true, если имя допустимо
 */
export function isSafeDbDocTableName(name: string): boolean {
  return /^[a-z][a-z0-9_]*$/.test(name);
}
