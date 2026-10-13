/**
 * @fileoverview Хендлер переименования таблицы проекта
 * @module routes/tables/handlers/renameTableHandler
 */

import type { Request, Response } from "express";
import { renameTableInProject } from "../../../database/bot-tables/mutate-table";
import { parseEntityName } from "../../../database/bot-tables/validate-cells";
import { fail, sqlFailure } from "../http-error";
import { notifyTableChange } from "../notify-table-change";
import { ownedTable } from "../owned-table";
import { tablePool } from "../table-db";

/**
 * Обрабатывает PUT /api/projects/:id/tables/:tableId
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function renameTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const name = parseEntityName(req.body?.name, true);
    if (typeof name !== "string") {
      fail(res, 400, name.message);
      return;
    }
    const table = await renameTableInProject(tablePool, owned.projectId, owned.table.id, name);
    if ("status" in table) {
      fail(res, table.status, table.message);
      return;
    }
    res.json(table);
    await notifyTableChange(owned.projectId, table.id, table.name);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
