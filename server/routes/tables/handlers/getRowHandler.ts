/**
 * @fileoverview Одна строка таблицы проекта
 * @module routes/tables/handlers/getRowHandler
 */

import type { Request, Response } from "express";
import { loadRowInProject } from "../../../database/bot-tables/load-scope";
import { fail, positiveId, sqlFailure } from "../http-error";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId/rows/:rowId
 * @param req - Запрос
 * @param res - Ответ
 */
export async function getRowHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const rowId = positiveId(req.params.rowId);
    if (rowId === null) {
      fail(res, 400, "Некорректный ID строки");
      return;
    }
    const row = await loadRowInProject(tablePool, owned.projectId, owned.table.id, rowId);
    if (!row) {
      fail(res, 404, "Строка не найдена");
      return;
    }
    res.json(row);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
