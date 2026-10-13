/**
 * @fileoverview Хендлер создания строк таблицы (батч)
 * @module routes/tables/handlers/createRowsHandler
 */

import type { Request, Response } from "express";
import { insertRowsInProject, nextRowIndex } from "../../../database/bot-tables/mutate-row";
import { validateCells } from "../../../database/bot-tables/validate-cells";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

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
    if (!Array.isArray(rows) || rows.length === 0) {
      fail(res, 400, "Массив rows обязателен и не может быть пустым");
      return;
    }
    const ids = new Set(owned.columns.map((column) => String(column.id)));
    const start = await nextRowIndex(tablePool, owned.table.id);
    const prepared = [];
    for (let index = 0; index < rows.length; index++) {
      const row = rows[index] as { rowIndex?: number; data?: unknown };
      const cells = validateCells(row.data ?? {}, ids);
      if (!cells.ok) {
        fail(res, 400, cells.message);
        return;
      }
      prepared.push({ rowIndex: typeof row.rowIndex === "number" ? row.rowIndex : start + index, data: cells.data });
    }
    const created = await insertRowsInProject(tablePool, owned.projectId, owned.table.id, prepared);
    if ("status" in created) {
      fail(res, created.status, created.message);
      return;
    }
    res.status(201).json(created);
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name, created.map((row) => row.data));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
