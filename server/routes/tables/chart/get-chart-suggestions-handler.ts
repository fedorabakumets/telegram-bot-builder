/**
 * @fileoverview Ответ с рекомендацией графика по столбцам таблицы.
 */
import type { Request, Response } from 'express';
import type { Pool } from 'pg';
import { loadChartSuggestions } from '../../../database/bot-tables/load-chart-suggestions';
import { parseSuggestionRequest } from './chart-params';
import { withChartRead } from './with-chart-read';

/**
 * Обрабатывает GET рекомендации графика.
 * @param req - Запрос.
 * @param res - Ответ.
 * @param pool - Пул базы.
 * @returns Ничего.
 */
export async function getChartSuggestionsHandler(req: Request, res: Response, pool: Pool): Promise<void> {
  const parsed = parseSuggestionRequest(req);
  if ('message' in parsed) {
    res.status(400).json({ message: parsed.message });
    return;
  }
  try {
    const result = await withChartRead(pool, client => loadChartSuggestions(client, parsed.projectId, parsed.tableId));
    if (!result.ok) {
      res.status(result.status).json({ message: result.message });
      return;
    }
    res.json(result.payload);
  } catch {
    res.status(500).json({ message: 'Не удалось подобрать график' });
  }
}
