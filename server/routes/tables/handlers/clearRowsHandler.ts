/**
 * @fileoverview Очистка всех строк таблицы
 * @module routes/tables/handlers/clearRowsHandler
 */

import type { Request, Response } from "express";
import { clearRowsInProject } from "../../../database/bot-tables/mutate-row";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId/rows
 * @param req - Запрос
 * @param res - Ответ
 */
export async function clearRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    if (req.body?.confirm !== true) {
      fail(res, 400, "Очистка строк необратима. Передайте confirm: true");
      return;
    }
    const cleared = await clearRowsInProject(tablePool, owned.projectId, owned.table.id);
    if ("status" in cleared) {
      fail(res, cleared.status, cleared.message);
      return;
    }
    res.json({ success: true, deleted: cleared.deleted });
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
