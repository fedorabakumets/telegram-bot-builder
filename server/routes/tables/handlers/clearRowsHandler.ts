/**
 * @fileoverview Очистка всех строк таблицы
 * @module routes/tables/handlers/clearRowsHandler
 */

import type { Request, Response } from "express";
import { tableWriteReceipt } from "../write-receipt";
import { clearRowsInProject } from "../../../database/bot-tables/mutate-row";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { withClient } from "../table-db";
import { lockedTableWrite } from '../locked-table-write';

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
    const cleared = await withClient(db => lockedTableWrite(db, owned.projectId, owned.table.id, client => clearRowsInProject(client, owned.projectId, owned.table.id)));
    if ("status" in cleared) {
      fail(res, cleared.status, cleared.message);
      return;
    }
    res.json(tableWriteReceipt(res, { success: true, deleted: cleared.deleted }, owned.projectId, owned.table.id));
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
