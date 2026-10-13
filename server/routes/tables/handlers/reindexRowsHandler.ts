/**
 * @fileoverview Хендлер переиндексации строк таблицы
 * @module routes/tables/handlers/reindexRowsHandler
 */

import type { Request, Response } from "express";
import { reindexRowsInProject } from "../../../database/bot-tables/mutate-row";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows/reindex
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function reindexRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const result = await reindexRowsInProject(tablePool, owned.projectId, owned.table.id);
    if ("status" in result) {
      fail(res, result.status, result.message);
      return;
    }
    res.json({ success: true });
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
