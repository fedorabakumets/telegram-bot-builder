/**
 * @fileoverview Новый порядок столбцов
 * @module routes/tables/handlers/reorderColumnsHandler
 */

import type { Request, Response } from "express";
import { reorderColumnsInProject } from "../../../database/bot-tables/mutate-column";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает PUT /api/projects/:id/tables/:tableId/columns/reorder
 * @param req - Запрос
 * @param res - Ответ
 */
export async function reorderColumnsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const columnIds = req.body?.column_ids;
    if (!Array.isArray(columnIds) || columnIds.some((id) => typeof id !== "number")) {
      fail(res, 400, "column_ids должен быть массивом чисел");
      return;
    }
    const columns = await reorderColumnsInProject(tablePool, owned.projectId, owned.table.id, columnIds);
    if ("status" in columns) {
      fail(res, columns.status, columns.message);
      return;
    }
    res.json(columns);
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
