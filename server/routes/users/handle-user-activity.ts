/**
 * @fileoverview Обработчик GET /api/projects/:id/users/activity
 * @module server/routes/users/handle-user-activity
 */

import type { Request, Response } from "express";
import type { Pool } from "pg";
import {
  isDailyUserActivityGranularity,
  queryUserActivityFromDaily,
} from "./query-user-activity-daily";
import { queryUserActivityRecent } from "./query-user-activity-recent";

/**
 * Параметры обработчика активности пользователей
 */
export interface HandleUserActivityDeps {
  /** Пул PostgreSQL */
  pool: Pool;
  /** ID проекта */
  projectId: number;
  /** ID токена или null (все боты) */
  tokenId: number | null;
  /** Гранулярность из query */
  granularity: string | undefined;
}

/**
 * Собирает ответ активности пользователей по гранулярности
 * @param deps - Пул, проект, токен, гранулярность
 * @returns Данные для res.json
 */
export async function buildUserActivityResponse(
  deps: HandleUserActivityDeps,
) {
  const gran = deps.granularity ?? "1d";

  if (isDailyUserActivityGranularity(gran)) {
    return queryUserActivityFromDaily(
      deps.pool,
      deps.projectId,
      deps.tokenId,
      gran,
    );
  }

  return queryUserActivityRecent(
    deps.pool,
    deps.projectId,
    deps.tokenId,
    gran,
  );
}

/**
 * Express-обработчик: пишет JSON или 500
 * @param req - Express request
 * @param res - Express response
 * @param pool - Пул PostgreSQL
 * @param projectId - ID проекта
 * @param tokenId - ID токена или null
 * @returns Promise<void>
 */
export async function handleUserActivity(
  req: Request,
  res: Response,
  pool: Pool,
  projectId: number,
  tokenId: number | null,
): Promise<void> {
  try {
    const granularity = req.query.granularity as string | undefined;
    const data = await buildUserActivityResponse({
      pool,
      projectId,
      tokenId,
      granularity,
    });
    res.json(data);
  } catch (error) {
    console.error("Error fetching user activity:", error);
    res.status(500).json({ message: "Ошибка при получении активности пользователей" });
  }
}
