/**
 * @fileoverview Пакетный импорт строк с проверкой до записи
 * @module routes/tables/handlers/importRowsHandler
 */

import type { Request, Response } from "express";
import { importRowsInProject } from "../../../database/bot-tables/import-rows";
import { MAX_ADD_ROWS } from "../../../database/bot-tables/limits";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { withClient } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows/import
 * @param req - Запрос
 * @param res - Ответ
 */
export async function importRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const mode = req.body?.mode === "replace" ? "replace" : req.body?.mode === "append" ? "append" : null;
    if (!mode) {
      fail(res, 400, "mode: append или replace");
      return;
    }
    if (mode === "replace" && req.body?.confirm !== true) {
      fail(res, 400, "Замена строк необратима. Передайте confirm: true");
      return;
    }
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > MAX_ADD_ROWS) {
      fail(res, 400, `Нужно от 1 до ${MAX_ADD_ROWS} строк`);
      return;
    }
    const imported = await withClient((db) => importRowsInProject(
      db,
      owned.projectId,
      owned.table.id,
      mode,
      rows as Array<Record<string, unknown>>,
    ));
    if ("status" in imported) {
      fail(res, imported.status, imported.message);
      return;
    }
    res.status(201).json(imported);
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name, imported.map((row) => row.data));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
