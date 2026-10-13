/**
 * @fileoverview Хендлер получения колонок таблицы
 * @module routes/tables/handlers/getColumnsHandler
 */

import type { Request, Response } from "express";
import { fail, sqlFailure } from "../http-error";
import { ownedTable } from "../owned-table";

/**
 * Обрабатывает GET /api/projects/:id/tables/:tableId/columns
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function getColumnsHandler(req: Request, res: Response): Promise<void> {
  try {
    const owned = await ownedTable(req, res);
    if (!owned) return;
    res.json(owned.columns);
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
