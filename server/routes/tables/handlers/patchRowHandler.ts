/**
 * @fileoverview Слияние ячеек строки
 * @module routes/tables/handlers/patchRowHandler
 */

import type { Request, Response } from "express";
import { mergeRowInProject } from "../../../database/bot-tables/mutate-row";
import { validateCells } from "../../../database/bot-tables/validate-cells";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает PATCH /api/projects/:id/tables/:tableId/rows/:rowId
 * @param req - Запрос
 * @param res - Ответ
 */
export async function patchRowHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const rowId = positiveId(req.params.rowId);
    if (rowId === null) {
      fail(res, 400, "Некорректный ID строки");
      return;
    }
    const cells = validateCells(req.body?.data, new Set(owned.columns.map((column) => String(column.id))));
    if (!cells.ok) {
      fail(res, 400, cells.message);
      return;
    }
    const row = await mergeRowInProject(tablePool, owned.projectId, owned.table.id, rowId, cells.data);
    if ("status" in row) {
      fail(res, row.status, row.message);
      return;
    }
    res.json(row);
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name, [row.data]);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
