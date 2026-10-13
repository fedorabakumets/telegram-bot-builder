/**
 * @fileoverview Ограниченная страница строк с фильтрами
 * @module routes/tables/handlers/queryRowsHandler
 */

import type { Request, Response } from "express";
import { parseRowQuery } from "../../../database/bot-tables/parse-row-query";
import { countRowsInProject, queryRowsInProject } from "../../../database/bot-tables/query-rows";
import { fail, sqlFailure } from "../http-error";
import { ownedTable } from "../owned-table";
import { withClient } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows/query
 * @param req - Запрос
 * @param res - Ответ
 */
export async function queryRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const allowed = new Set(owned.columns.map((column) => column.id));
    const parsed = parseRowQuery(req.body, allowed);
    if ("message" in parsed) {
      fail(res, 400, parsed.message);
      return;
    }
    const page = await withClient((db) => queryRowsInProject(
      db,
      owned.projectId,
      owned.table.id,
      parsed.filters,
      parsed.sort,
      parsed.limit,
      parsed.offset,
      parsed.columnIds,
    ));
    res.json(page);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}

/**
 * Обрабатывает POST /api/projects/:id/tables/:tableId/rows/count
 * @param req - Запрос
 * @param res - Ответ
 */
export async function countRowsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    const allowed = new Set(owned.columns.map((column) => column.id));
    const parsed = parseRowQuery({ ...req.body, limit: 1, offset: 0 }, allowed);
    if ("message" in parsed) {
      fail(res, 400, parsed.message);
      return;
    }
    const total = await withClient((db) => countRowsInProject(db, owned.projectId, owned.table.id, parsed.filters));
    res.json({ total });
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
