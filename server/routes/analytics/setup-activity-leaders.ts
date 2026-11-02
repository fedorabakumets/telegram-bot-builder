/** @fileoverview Авторизованный API двух рейтингов с проверкой периода и принадлежности бота. */
import type { Express, RequestHandler } from 'express';
import type { Pool } from 'pg';
import { CHART_WINDOW_INTERVAL } from '../messages/chart-granularity-config';
import { queryActivityLeaders } from './query-activity-leaders';

/**
 * Регистрирует единый API рейтингов пользователей и групп.
 * @param app - Приложение с авторизацией API.
 * @param pool - Пул базы.
 * @param access - Проверка доступа к проекту.
 */
export function setupActivityLeaders(app: Express, pool: Pool, access: RequestHandler): void {
  app.get('/api/projects/:id/analytics/activity-leaders', access, async (req, res) => {
    const projectId = Number(req.params.id);
    const tokenId = req.query.tokenId === undefined ? null : Number(req.query.tokenId);
    const period = req.query.granularity ?? '1d';
    if (!Number.isSafeInteger(projectId) || projectId <= 0 ||
      (tokenId !== null && (!Number.isSafeInteger(tokenId) || tokenId <= 0)) ||
      typeof period !== 'string' || !Object.prototype.hasOwnProperty.call(CHART_WINDOW_INTERVAL, period) ||
      Object.values(req.query).some(value => typeof value !== 'string')) {
      res.status(400).json({ message: 'Некорректный проект, бот или период' }); return;
    }
    try {
      if (tokenId !== null) {
        const token = await pool.query('SELECT id FROM bot_tokens WHERE id=$1 AND project_id=$2', [tokenId, projectId]);
        if (!token.rowCount) { res.status(403).json({ message: 'Бот не принадлежит проекту' }); return; }
      }
      const asOf = new Date().toISOString();
      const leaders = await queryActivityLeaders(pool, projectId, tokenId, CHART_WINDOW_INTERVAL[period], asOf);
      res.json({ ...leaders, as_of: asOf, granularity: period });
    } catch {
      res.status(500).json({ message: 'Не удалось получить рейтинги активности' });
    }
  });
}
