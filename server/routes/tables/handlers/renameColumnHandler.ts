/**
 * @fileoverview Хендлер переименования колонки таблицы
 * @module routes/tables/handlers/renameColumnHandler
 */

import type { Request, Response } from "express";
import { renameColumnInProject } from "../../../database/bot-tables/mutate-column";
import { parseEntityName } from "../../../database/bot-tables/validate-cells";
import { fail, positiveId, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает PUT /api/projects/:id/tables/:tableId/columns/:columnId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function renameColumnHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const columnId = positiveId(req.params.columnId);
    if (columnId === null) {
      fail(res, 400, "Некорректный ID колонки");
      return;
    }
    const name = parseEntityName(req.body?.name, false);
    if (typeof name !== "string") {
      fail(res, 400, name.message);
      return;
    }
    const column = await renameColumnInProject(tablePool, owned.projectId, owned.table.id, columnId, name);
    if ("status" in column) {
      fail(res, column.status, column.message);
      return;
    }
    res.json(column);
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
