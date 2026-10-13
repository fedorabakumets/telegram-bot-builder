/**
 * @fileoverview Хендлер создания таблицы проекта
 * @module routes/tables/handlers/createTableHandler
 */

import type { Request, Response } from "express";
import { mapTable } from "../../../database/bot-tables/map-records";
import { parseEntityName } from "../../../database/bot-tables/validate-cells";
import { fail, positiveId, sqlFailure } from "../http-error";
import { tablePool } from "../table-db";

/**
 * Обрабатывает POST /api/projects/:id/tables
 * @param req - Объект запроса
 * @param res - Объект ответа
 */
export async function createTableHandler(req: Request, res: Response): Promise<void> {
  try {
    const projectId = positiveId(req.params.id);
    if (projectId === null) {
      fail(res, 400, "Некорректный ID проекта");
      return;
    }
    const name = parseEntityName(req.body?.name, true);
    if (typeof name !== "string") {
      fail(res, 400, name.message);
      return;
    }
    const inserted = await tablePool.query(
      `INSERT INTO bot_tables (project_id, name) VALUES ($1, $2) RETURNING id, project_id, name, created_at`,
      [projectId, name],
    );
    res.status(201).json(mapTable(inserted.rows[0] as never));
  } catch (error) {
    const parsed = sqlFailure(error);
    fail(res, parsed.status, "Не удалось создать таблицу");
  }
}
