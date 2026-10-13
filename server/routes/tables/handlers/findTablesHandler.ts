/**
 * @fileoverview Поиск таблиц проекта по части имени
 * @module routes/tables/handlers/findTablesHandler
 */

import type { Request, Response } from "express";
import { findTablesInProject } from "../../../database/bot-tables/list-rows";
import { fail, positiveId, sqlFailure } from "../http-error";
import { tablePool } from "../table-db";

/**
 * Обрабатывает GET /api/projects/:id/tables/search
 * @param req - Запрос
 * @param res - Ответ
 */
export async function findTablesHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = positiveId(req.params.id);
    if (projectId === null) {
      fail(res, 400, "Некорректный ID проекта");
      return;
    }
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (!query || query.length > 255) {
      fail(res, 400, "Параметр q обязателен");
      return;
    }
    const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      fail(res, 400, "limit от 1 до 100");
      return;
    }
    res.json(await findTablesInProject(tablePool, projectId, query, limit));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, parsed.message);
  }
}
