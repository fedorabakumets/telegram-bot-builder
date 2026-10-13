/**
 * @fileoverview Хендлер создания колонки таблицы
 * @module routes/tables/handlers/createColumnHandler
 */

import type { Request, Response } from "express";
import { addColumnInProject } from "../../../database/bot-tables/mutate-column";
import { parseEntityName } from "../../../database/bot-tables/validate-cells";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/columns
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function createColumnHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const name = parseEntityName(req.body?.name, false);
    if (typeof name !== "string") {
      fail(res, 400, name.message);
      return;
    }
    const position = typeof req.body?.position === "number" ? req.body.position : owned.columns.length;
    const column = await addColumnInProject(tablePool, owned.projectId, owned.table.id, name, position);
    if ("status" in column) {
      fail(res, column.status, column.message);
      return;
    }
    res.status(201).json(column);
    await notifyTableChange(owned.projectId, owned.table.id, owned.table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
