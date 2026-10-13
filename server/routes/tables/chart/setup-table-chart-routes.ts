/**
 * @fileoverview Маршруты графика и рекомендации по пользовательской таблице.
 */
import type { Express, RequestHandler } from 'express';
import type { Pool } from 'pg';
import { getChartSuggestionsHandler } from './get-chart-suggestions-handler';
import { getTableChartHandler } from './get-table-chart-handler';

/**
 * Регистрирует чтение графика после проверки доступа к проекту.
 * @param app - Приложение Express.
 * @param ready - Проверка готовности базы.
 * @param access - Проверка владельца или участника.
 * @param pool - Пул базы.
 * @returns Ничего.
 */
export function setupTableChartRoutes(app: Express, ready: RequestHandler, access: RequestHandler, pool: Pool): void {
  const chart = '/api/projects/:id/tables/:tableId/chart';
  app.get(chart, ready, access, (req, res) => { void getTableChartHandler(req, res, pool); });
  app.get(`${chart}/recommendations`, ready, access, (req, res) => { void getChartSuggestionsHandler(req, res, pool); });
}
