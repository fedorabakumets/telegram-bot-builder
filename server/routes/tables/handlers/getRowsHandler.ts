/**
 * @fileoverview Хендлер получения строк таблицы
 * @module routes/tables/handlers/getRowsHandler
 */

import type { Request, Response } from "express";
import { listRowsInProject } from "../../../database/bot-tables/list-rows";
import { fail, sqlFailure } from "../http-error";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId/rows
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function getRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    res.json(await listRowsInProject(tablePool, owned.projectId, owned.table.id));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
