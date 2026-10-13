/**
 * @fileoverview График пользовательской таблицы через авторизованный API.
 */
import type { TableChartPayload } from '../../shared/analytics/table-chart/payload.ts';
import type { TableChartSuggestionPayload } from '../../shared/analytics/table-chart/suggest.ts';
import { readTableChart, readTableChartSuggestion, validTableChartOptions, type TableChartReadOptions } from './table-chart-read.ts';

/**
 * Превращает сбой в короткую ошибку без тела ответа.
 * @param error - Исключение чтения.
 * @returns Безопасное сообщение.
 */
function tableChartError(error: unknown): { error: string } {
  const message = error instanceof Error ? error.message : '';
  if (/^Не удалось получить график: HTTP \d+$/.test(message) || message === 'Некорректный ответ API графика') return { error: message };
  return { error: 'Не удалось получить график из API приложения' };
}

/**
 * Возвращает точки графика таблицы.
 * @param projectId - Проект.
 * @param options - Таблица, столбцы и подсчёт.
 * @returns График или безопасная ошибка.
 */
export async function getTableChartInDb(projectId: number, options: TableChartReadOptions = {}): Promise<TableChartPayload | { error: string }> {
  if (!validTableChartOptions(projectId, options)) return { error: 'Некорректные параметры графика' };
  try { return await readTableChart(projectId, options); }
  catch (error) { return tableChartError(error); }
}

/**
 * Возвращает рекомендацию столбцов и вида графика.
 * @param projectId - Проект.
 * @param options - Таблица и адрес приложения.
 * @returns Рекомендация или безопасная ошибка.
 */
export async function suggestTableChartInDb(projectId: number, options: TableChartReadOptions = {}): Promise<TableChartSuggestionPayload | { error: string }> {
  if (!Number.isSafeInteger(projectId) || projectId <= 0 || !Number.isSafeInteger(options.tableId) || (options.tableId ?? 0) <= 0) return { error: 'Некорректные параметры графика' };
  try { return await readTableChartSuggestion(projectId, options); }
  catch (error) { return tableChartError(error); }
}
