/**
 * @fileoverview Совместимость старых адресов фреймов с опубликованными справочниками.
 */
import type { Request, Response } from "express";

/** Адрес опубликованной документации */
const DOCS_URL = "https://fedorabakumets.github.io/telegram-bot-builder/docs";

/**
 * Открывает главную страницу схемы базы без локальных Markdown-файлов.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveSchemaDocsEmbedIndex(_req: Request, res: Response): void {
  res.redirect(302, `${DOCS_URL}/database`);
}

/**
 * Открывает описание указанной таблицы на сайте документации.
 * @param req - Запрос с именем таблицы
 * @param res - Ответ Express
 * @returns void
 */
export function serveSchemaDocsEmbedTable(req: Request, res: Response): void {
  res.redirect(302, `${DOCS_URL}/database/${encodeURIComponent(req.params.tableName ?? "")}`);
}

/**
 * Открывает главную страницу справочника API без локальных Markdown-файлов.
 * @param _req - Запрос Express
 * @param res - Ответ Express
 * @returns void
 */
export function serveApiDocsEmbedIndex(_req: Request, res: Response): void {
  res.redirect(302, `${DOCS_URL}/api`);
}

/**
 * Открывает указанный раздел API на сайте документации.
 * @param req - Запрос с ключом раздела
 * @param res - Ответ Express
 * @returns void
 */
export function serveApiDocsEmbedTag(req: Request, res: Response): void {
  res.redirect(302, `${DOCS_URL}/api/${encodeURIComponent(req.params.slug ?? "")}`);
}
