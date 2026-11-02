/** @fileoverview Авторизованный HTTP-контракт общего снимка новой методики аналитики. */
import type { Express, RequestHandler } from 'express';
import type { Pool } from 'pg';
import { readAnalyticsV2Snapshot } from './snapshot';
import { resolveV2Range } from './range';
/**
 * Регистрирует чтение снимка с проверкой области и безопасными ошибками.
 * @param app - Приложение с общей авторизацией API.
 * @param pool - Пул PostgreSQL.
 * @param access - Проверка доступа к проекту.
 * @returns Ничего.
 */
export function setupAnalyticsV2Routes(app: Express, pool: Pool, access: RequestHandler): void {
  app.get('/api/projects/:id/analytics/v2/snapshot', access, async (req, res) => {
    const project = Number(req.params.id);
    const token = req.query.tokenId === undefined ? null : Number(req.query.tokenId);
    const now = Date.now();
    try {
      if (!Number.isSafeInteger(project) || project <= 0 || (token !== null && (!Number.isSafeInteger(token) || token <= 0))) throw new Error('Некорректный проект или бот');
      if (Object.values(req.query).some(value => typeof value !== 'string')) throw new Error('Параметры должны быть строками');
      resolveV2Range(req.query as Record<string, string>, now, null);
    } catch (error) { res.status(400).json({ message: error instanceof Error ? error.message : 'Некорректные параметры' }); return; }
    let client;
    try { client = await pool.connect(); }
    catch { res.status(503).json({ message: 'Хранилище аналитики временно недоступно' }); return; }
    try {
      await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ READ ONLY');
      await client.query("SET LOCAL TIME ZONE 'UTC'");
      await client.query("SET LOCAL statement_timeout='15000ms'");
      if (token !== null && !(await client.query('SELECT id FROM bot_tokens WHERE project_id=$1 AND id=$2', [project, token])).rowCount) {
        await client.query('ROLLBACK'); res.status(403).json({ message: 'Бот не принадлежит проекту' }); return;
      }
      const snapshot = await readAnalyticsV2Snapshot(client, project, token, req.query as Record<string, string>, now);
      await client.query('COMMIT');
      res.setHeader('Cache-Control', 'no-store');
      res.json(snapshot);
    } catch (error) {
      await client.query('ROLLBACK').catch(() => undefined);
      const code = (error as { code?: string }).code;
      res.status(code === '42P01' || code === '42883' ? 503 : 500).json({ message: code === '42P01' || code === '42883'
        ? 'Подтверждённая аналитика ещё не подготовлена на сервере' : 'Не удалось получить снимок аналитики' });
    } finally { client.release(); }
  });
}
