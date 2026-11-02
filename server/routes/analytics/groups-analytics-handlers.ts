/**
 * @fileoverview Чтение групп проекта или выбранного бота с проверкой доступа к проекту.
 * @module server/routes/analytics/groups-analytics-handlers
 */
import type { Express, Request, Response } from 'express';
import { pool } from '../../database/db';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { getRequestTokenId } from '../utils/resolve-request-token';
import { queryGroupsGrowth, queryGroupsStats } from './groups-analytics-query';

/**
 * Отдаёт текущие числа групп.
 * @param req - Проект и бот
 * @param res - Сводка
 * @returns Завершение
 */
async function groupsStatsHandler(req: Request, res: Response): Promise<void> {
  /** Отсутствие фильтра означает уникальные группы всего проекта. */
  const tokenId = getRequestTokenId(req);
  const stats = await queryGroupsStats(pool, Number(req.params.projectId), tokenId);
  res.json(stats);
}

/**
 * Отдаёт ряд первого сохранения групп.
 * @param req - Проект, бот и период
 * @param res - Точки графика
 * @returns Завершение
 */
async function groupsGrowthHandler(req: Request, res: Response): Promise<void> {
  /** Отсутствие фильтра означает уникальные группы всего проекта. */
  const tokenId = getRequestTokenId(req);
  const points = await queryGroupsGrowth(
    pool, Number(req.params.projectId), tokenId, req.query.granularity as string | undefined,
  );
  res.json(points);
}

/**
 * Регистрирует сводку и график групп.
 * @param app - Приложение
 * @returns Ничего
 */
export function registerGroupsAnalyticsRoutes(app: Express): void {
  app.get('/api/projects/:projectId/groups/analytics/stats', requireProjectAccess, groupsStatsHandler);
  app.get('/api/projects/:projectId/groups/analytics/growth', requireProjectAccess, groupsGrowthHandler);
}
