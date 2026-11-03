/**
 * @fileoverview Хендлер создания строк таблицы (батч)
 * @module routes/tables/handlers/createRowsHandler
 */

import type { Request, Response } from "express";
import { tableWriteReceipt } from "../write-receipt";
import { createRowsLocked } from "../locked-create-rows";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { withClient } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function createRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const rows = req.body?.rows;
    if (!Array.isArray(rows) || rows.length === 0 || rows.length > 200) {
      fail(res, 400, "Массив rows обязателен и не может быть пустым");
      return;
    }
    const created = await withClient(db => createRowsLocked(db, owned.projectId, owned.table.id, rows));
    if ("status" in created) {
      fail(res, created.status, created.message);
      return;
    }
    res.status(201).json(tableWriteReceipt(res, created, owned.projectId, owned.table.id));
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name, created.map((row) => row.data));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
