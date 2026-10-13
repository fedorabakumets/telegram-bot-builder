/**
 * @fileoverview Таблица со схемой и сводкой
 * @module routes/tables/handlers/getTableHandler
 */

import type { Request, Response } from "express";
import { loadTableSummary } from "../../../database/bot-tables/summary";
import { fail, sqlFailure } from "../http-error";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId
 * @param req - Запрос
 * @param res - Ответ
 */
export async function getTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const summary = await loadTableSummary(tablePool, owned.projectId, owned.table.id, owned.columns);
    res.json({ table: owned.table, columns: owned.columns, summary });
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
