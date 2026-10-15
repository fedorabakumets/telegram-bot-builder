/**
 * @fileoverview Чтения карточки «Группы» для выбранного бота.
 * @module server/routes/analytics/groups-analytics-handlers
 */
import type { Express, Request, Response } from 'express';
import { pool } from '../../database/db';
import { requireProjectAccess } from '../../middleware/requireProjectAccess';
import { getRequestTokenId } from '../utils/resolve-request-token';
import { queryGroupsGrowth, queryGroupsStats } from './groups-analytics-query';

/**
 * Требует выбранного бота, чтобы не смешивать группы разных ботов.
 * @param req - Запрос
 * @param res - Ответ
 * @returns Идентификатор бота или null, если ответ уже отправлен
 */
function requiredTokenId(req: Request, res: Response): number | null {
  const tokenId = getRequestTokenId(req);
  if (!tokenId) {
    res.status(400).json({ message: 'Выберите бота' });
    return null;
  }
  return tokenId;
}

/**
 * Отдаёт текущие числа групп.
 * @param req - Проект и бот
 * @param res - Сводка
 * @returns Завершение
 */
async function groupsStatsHandler(req: Request, res: Response): Promise<void> {
  const tokenId = requiredTokenId(req, res);
  if (!tokenId) return;
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
  const tokenId = requiredTokenId(req, res);
  if (!tokenId) return;
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
