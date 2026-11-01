/**
 * @fileoverview Слияние ячеек строки
 * @module routes/tables/handlers/patchRowHandler
 */

import type { Request, Response } from "express";
import { applyCellEdits, TableEditError } from '../../../database/bot-tables/apply-cell-edits';
import { mergeRowInProject } from "../../../database/bot-tables/mutate-row";
import { validateCells } from "../../../database/bot-tables/validate-cells";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool, withClient } from "../table-db";

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
    const cells = validateCells(req.body?.data, new Set(owned.columns.map((column) => String(column.id))), owned.columns);
    if (!cells.ok) {
      fail(res, 400, cells.message);
      return;
    }
    /** Ожидаемые значения включают каждую изменяемую ячейку при условном сохранении. */
    const expected = req.body?.expected === undefined ? null : validateCells(req.body.expected, new Set(Object.keys(cells.data)));
    if (expected && (!expected.ok || Object.keys(cells.data).some((key) => !(key in expected.data)))) {
      fail(res, 400, 'Для каждой изменяемой ячейки требуется исходное значение');
      return;
    }
    if (expected && Object.keys(cells.data).length === 0) { fail(res, 400, 'Нужна хотя бы одна изменяемая ячейка'); return; }
    const row = expected && expected.ok
      ? (await withClient((db) => applyCellEdits(db, owned.projectId, owned.table.id, Object.entries(cells.data).map(([columnId, after]) => ({ rowId, columnId, after, before: expected.data[columnId] })))))[0]
      : await mergeRowInProject(tablePool, owned.projectId, owned.table.id, rowId, cells.data);
    if ("status" in row) {
      fail(res, row.status, row.message);
      return;
    }
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name, expected ? [] : [row.data]);
    res.json(row);
  } catch (error) {
    const parsed = error instanceof TableEditError ? error : sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
