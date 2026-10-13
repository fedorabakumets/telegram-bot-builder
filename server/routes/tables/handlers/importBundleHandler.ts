/**
 * @fileoverview Импорт общего JSON версии 1
 * @module routes/tables/handlers/importBundleHandler
 */

import type { Request, Response } from "express";
import { importBundleInProject, type BundleTable } from "../../../database/bot-tables/import-bundle";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { withClient } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/import
 * @param req - Запрос
 * @param res - Ответ
 */
export async function importBundleHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = positiveId(req.params.id);
    if (projectId === null) {
      fail(res, 400, "Некорректный ID проекта");
      return;
    }
    const mode = req.body?.mode === "replace" ? "replace" : req.body?.mode === "create" ? "create" : null;
    if (!mode) {
      fail(res, 400, "mode: create или replace");
      return;
    }
    if (mode === "replace" && req.body?.confirm !== true) {
      fail(res, 400, "Замена таблиц необратима. Передайте confirm: true");
      return;
    }
    const tables = parseBundle(req.body?.tables);
    if ("message" in tables) {
      fail(res, 400, tables.message);
      return;
    }
    const imported = await withClient((db) => importBundleInProject(db, projectId, mode, tables));
    if (!imported.ok) {
      res.status(imported.status).json({ message: imported.message, failed_table_index: imported.failed_table_index });
      return;
    }
    res.status(201).json(imported);
    for (const table of imported.tables) await notifyTableChange(projectId, table.tableId, table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}

/**
 * Проверяет массив таблиц файла
 * @param input - Поле tables
 * @returns Таблицы или ошибка
 */
function parseBundle(input: unknown): BundleTable[] | { message: string } {
  if (!Array.isArray(input) || input.length === 0 || input.length > 50) {
    return { message: "Нужно от 1 до 50 таблиц" };
  }
  const tables: BundleTable[] = [];
  for (const item of input) {
    if (!item || typeof item !== "object") return { message: "Таблица должна быть объектом" };
    const table = item as BundleTable;
    if (!Array.isArray(table.columns) || !Array.isArray(table.rows)) return { message: "У таблицы нужны columns и rows" };
    tables.push({
      name: String(table.name ?? ""),
      columns: table.columns.map(String),
      rows: table.rows.map((row) => (Array.isArray(row) ? row.map(String) : [])),
    });
  }
  return tables;
}
