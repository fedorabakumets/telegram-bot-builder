/**
 * @fileoverview Сводка строк и заполненности столбцов
 * @module routes/tables/handlers/summaryHandler
 */

import type { Request, Response } from "express";
import { loadTableSummary } from "../../../database/bot-tables/summary";
import { fail, sqlFailure } from "../http-error";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId/summary
 * @param req - Запрос
 * @param res - Ответ
 */
export async function summaryHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    res.json(await loadTableSummary(tablePool, owned.projectId, owned.table.id, owned.columns));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
