/**
 * @fileoverview Новый порядок столбцов
 * @module routes/tables/handlers/reorderColumnsHandler
 */

import type { Request, Response } from "express";
import { reorderColumnsInProject } from "../../../database/bot-tables/mutate-column";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { withClient } from "../table-db";
import { lockedTableWrite } from '../locked-table-write';
import { tableWriteReceipt } from '../write-receipt';

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
    if (!Array.isArray(columnIds) || columnIds.some((id) => typeof id !== "number") || new Set(columnIds).size !== columnIds.length) {
      fail(res, 400, "column_ids должен быть массивом чисел");
      return;
    }
    const columns = await withClient(db => lockedTableWrite(db, owned.projectId, owned.table.id, client => reorderColumnsInProject(client, owned.projectId, owned.table.id, columnIds)));
    if ("status" in columns) {
      fail(res, columns.status, columns.message);
      return;
    }
    res.json(tableWriteReceipt(res, columns, owned.projectId, owned.table.id));
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
