/**
 * @fileoverview Хендлер удаления колонки таблицы
 * @module routes/tables/handlers/deleteColumnHandler
 */

import type { Request, Response } from "express";
import { deleteColumnInProject } from "../../../database/bot-tables/mutate-column";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId/columns/:columnId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteColumnHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const columnId = positiveId(req.params.columnId);
    if (columnId === null) {
      fail(res, 400, "Некорректный ID колонки");
      return;
    }
    const deleted = await deleteColumnInProject(tablePool, owned.projectId, owned.table.id, columnId);
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
