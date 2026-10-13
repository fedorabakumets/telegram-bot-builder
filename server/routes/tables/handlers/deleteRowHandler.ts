/**
 * @fileoverview Хендлер удаления строки таблицы
 * @module routes/tables/handlers/deleteRowHandler
 */

import type { Request, Response } from "express";
import { deleteRowInProject } from "../../../database/bot-tables/mutate-row";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId/rows/:rowId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteRowHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const rowId = positiveId(req.params.rowId);
    if (rowId === null) {
      fail(res, 400, "Некорректный ID строки");
      return;
    }
    const deleted = await deleteRowInProject(tablePool, owned.projectId, owned.table.id, rowId);
    if ("status" in deleted) {
      fail(res, deleted.status, deleted.message);
      return;
    }
    res.json({ success: true });
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
