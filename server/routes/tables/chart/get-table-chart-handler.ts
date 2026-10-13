/**
 * @fileoverview Ответ с точками графика пользовательской таблицы.
 */
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { loadTableChart } from '../../../database/bot-tables/load-table-chart';
import { parseChartRequest } from './chart-params';
import { withChartRead } from './with-chart-read';

/**
 * Обрабатывает GET графика таблицы.
 * @param req - Запрос.
 * @param res - Ответ.
 * @param pool - Пул базы.
 * @returns Ничего.
 */
export async function getTableChartHandler(req: Request, res: Response, pool: Pool): Promise<void> {
  const parsed = parseChartRequest(req);
  if ('message' in parsed) {
    res.status(400).json({ message: parsed.message });
    return;
  }
  try {
    const result = await withChartRead(pool, client => loadTableChart(client, parsed));
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.json(result.payload);
  } catch (error) {
    const unavailable = error instanceof Error && /connect|ECONNREFUSED|timeout/i.test(error.message);
    res.status(unavailable ? 503 : 500).json({ message: unavailable ? 'База аналитики недоступна' : 'Не удалось построить график' });
  }
}
