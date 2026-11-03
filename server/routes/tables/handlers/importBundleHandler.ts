/**
 * @fileoverview Импорт общего JSON версии 1
 * @module routes/tables/handlers/importBundleHandler
 */

import type { Request, Response } from "express";
import { importBundleInProject, type BundleTable } from "../../../database/bot-tables/import-bundle";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { withClient } from "../table-db";
import { tableBundleSchema } from '../../../../shared/table-bundle-schema';

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
    /** Импорт возвращает успех только после общего COMMIT всех таблиц. */
    res.status(201).json({ ...imported, persistence: { confirmed: true, projectId } });
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
  /** Общая проверка не позволяет двум исходным колонкам записать одну целевую ячейку. */
  const checked = tableBundleSchema.safeParse({ tables: input });
  if (!checked.success) return { message: checked.error.issues[0]?.message ?? 'Проверьте таблицы пакета' };
  return checked.data.tables;
}
