/**
 * @fileoverview Хендлер удаления таблицы проекта
 * @module routes/tables/handlers/deleteTableHandler
 */

import type { Request, Response } from "express";
import { deleteTableInProject } from "../../../database/bot-tables/mutate-table";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает DELETE /api/projects/:id/tables/:tableId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function deleteTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const deleted = await deleteTableInProject(tablePool, owned.projectId, owned.table.id);
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
