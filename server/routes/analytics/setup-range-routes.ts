/** @fileoverview Авторизованный API точных диапазонов и сравнения в общем снимке. */
import type { Express, RequestHandler } from 'express';
import type { Pool } from 'pg';
import { analyticsChange, resolveAnalyticsRange, type AnalyticsRangeOptions } from '../../../shared/analytics/range';
import { queryAnalyticsRange, supportsDailyRange } from './query-range';
import { RANGE_METRICS } from './range-events';
/**
 * Регистрирует доступ только для чтения с проверкой доступа к проекту.
 * @param app - Приложение Express после авторизации API.
 * @param pool - Пул базы данных.
 * @param access - Проверка владельца или коллаборатора.
 * @returns Ничего.
 */
export function setupAnalyticsRangeRoutes(app: Express, pool: Pool, access: RequestHandler): void {
  app.get('/api/projects/:id/analytics/range', access, async (req, res) => {
    const now = Date.now();
    const projectId = Number(req.params.id);
    const tokenId = req.query.tokenId === undefined ? null : Number(req.query.tokenId);
    let range;
    let comparison = null;
    const metric = req.query.metric;
    try {
      if (!Number.isSafeInteger(projectId) || projectId <= 0 || (tokenId !== null && (!Number.isSafeInteger(tokenId) || tokenId <= 0))) throw new Error('Некорректный проект или токен');
      if (!RANGE_METRICS.includes(metric as typeof RANGE_METRICS[number])) throw new Error('Некорректная метрика');
      for (const value of Object.values(req.query)) if (typeof value !== 'string') throw new Error('Параметры должны быть строками');
      range = resolveAnalyticsRange(req.query as AnalyticsRangeOptions, now);
      if (req.query.comparison !== undefined && !['previous', 'explicit'].includes(String(req.query.comparison))) throw new Error('Некорректный режим сравнения');
      if (!req.query.comparison && (req.query.compare_from || req.query.compare_to)) throw new Error('Укажите comparison=explicit');
      if (req.query.comparison === 'previous') {
        if (req.query.compare_from || req.query.compare_to) throw new Error('Для previous дополнительные даты запрещены');
        comparison = resolveAnalyticsRange({ from: new Date(Date.parse(range.from) - range.duration_ms).toISOString(), to: range.from, step: range.step }, now);
      } else if (req.query.comparison === 'explicit') {
        if (!req.query.compare_from || !req.query.compare_to) throw new Error('Укажите обе даты сравнения');
        comparison = resolveAnalyticsRange({ from: String(req.query.compare_from), to: String(req.query.compare_to), step: range.step }, now);
      }
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : 'Некорректные параметры' });
      return;
    }
    let client;
    try { client = await pool.connect(); }
    catch { res.status(503).json({ message: 'База аналитики недоступна' }); return; }
    try {
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      await client.query("SET LOCAL TIME ZONE 'UTC'");
      await client.query("SET LOCAL statement_timeout = '10000ms'");
      if (tokenId !== null) {
        const token = await client.query('SELECT id FROM bot_tokens WHERE id = $1 AND project_id = $2', [tokenId, projectId]);
        if (!token.rowCount) { await client.query('ROLLBACK'); res.status(403).json({ message: 'Токен не принадлежит проекту' }); return; }
      }
      const daily = supportsDailyRange(range) && (!comparison || supportsDailyRange(comparison));
      const current = await queryAnalyticsRange(client, projectId, tokenId, metric as typeof RANGE_METRICS[number], range, daily);
      const previous = comparison ? await queryAnalyticsRange(client, projectId, tokenId, metric as typeof RANGE_METRICS[number], comparison, daily) : null;
      await client.query('COMMIT');
      res.json({ project_id: projectId, token_id: tokenId, as_of: new Date(now).toISOString(), current, previous,
        comparison_mode: req.query.comparison ?? null,
        change: previous ? Object.fromEntries(['count', 'incoming', 'outgoing', 'newcomers'].map(key => [key, analyticsChange(current.summary[key as keyof typeof current.summary], previous.summary[key as keyof typeof previous.summary])])) : null });
    } catch {
      try { await client.query('ROLLBACK'); } catch { /* Ошибка отката не должна скрывать безопасный ответ. */ }
      res.status(500).json({ message: 'Не удалось получить аналитику диапазона' });
    } finally { client.release(); }
  });
}
