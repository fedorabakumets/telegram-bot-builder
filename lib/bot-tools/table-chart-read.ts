/**
 * @fileoverview Проверка параметров и ответа графика таблицы.
 */
import { apiFetch } from './api-fetch.ts';
import { TABLE_AGGREGATIONS, TABLE_CHART_LIMIT, type TableAggregation, type TableChartPoint } from '../../shared/analytics/table-chart/types.ts';
import type { TableChartPayload } from '../../shared/analytics/table-chart/payload.ts';
import type { TableChartSuggestionPayload } from '../../shared/analytics/table-chart/suggest.ts';

/** Параметры чтения графика. */
export interface TableChartReadOptions {
  /** Таблица. */
  tableId?: number;
  /** Столбец групп. */
  xColumnId?: number;
  /** Столбец значений. */
  yColumnId?: number;
  /** Способ подсчёта. */
  aggregation?: TableAggregation;
  /** Предел групп. */
  limit?: number;
  /** Адрес приложения. */
  apiBaseUrl?: string;
}

/**
 * Проверяет положительное целое.
 * @param value - Число.
 * @returns Признак допустимого идентификатора.
 */
function positive(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0;
}

/**
 * Проверяет параметры до обращения к API.
 * @param projectId - Проект.
 * @param options - Параметры графика.
 * @returns Признак допустимого запроса.
 */
export function validTableChartOptions(projectId: number, options: TableChartReadOptions): boolean {
  return positive(projectId) && positive(options.tableId) && positive(options.xColumnId) && positive(options.yColumnId) &&
    TABLE_AGGREGATIONS.includes(options.aggregation ?? 'count') &&
    (options.limit === undefined || (Number.isSafeInteger(options.limit) && options.limit >= 1 && options.limit <= TABLE_CHART_LIMIT));
}

/**
 * Читает JSON и скрывает тело ошибки.
 * @param path - Путь API.
 * @param apiBaseUrl - Адрес приложения.
 * @returns Разобранный ответ.
 */
async function readJson(path: string, apiBaseUrl?: string): Promise<unknown> {
  const response = await apiFetch(path, { apiBaseUrl });
  if (!response.ok) throw new Error(`Не удалось получить график: HTTP ${response.status}`);
  return response.json();
}

/**
 * Проверяет точку графика.
 * @param point - Элемент ответа.
 * @returns Признак точки.
 */
function validPoint(point: unknown): point is TableChartPoint {
  if (!point || typeof point !== 'object') return false;
  const item = point as TableChartPoint;
  return typeof item.label === 'string' && item.label.length <= 500 && typeof item.value === 'number' && Number.isFinite(item.value);
}

/**
 * Загружает и проверяет график.
 * @param projectId - Проект.
 * @param options - Параметры.
 * @returns Ответ API.
 */
export async function readTableChart(projectId: number, options: TableChartReadOptions): Promise<TableChartPayload> {
  const params = new URLSearchParams({ xColumnId: String(options.xColumnId), yColumnId: String(options.yColumnId), aggregation: options.aggregation ?? 'count' });
  if (options.limit !== undefined) params.set('limit', String(options.limit));
  const data = await readJson(`/api/projects/${projectId}/tables/${options.tableId}/chart?${params}`, options.apiBaseUrl) as TableChartPayload;
  if (!data || !Array.isArray(data.points) || data.points.length > TABLE_CHART_LIMIT || !data.points.every(validPoint) || !Array.isArray(data.warnings)) {
    throw new Error('Некорректный ответ API графика');
  }
  return data;
}

/**
 * Загружает рекомендацию.
 * @param projectId - Проект.
 * @param options - Таблица и адрес.
 * @returns Ответ API.
 */
export async function readTableChartSuggestion(projectId: number, options: TableChartReadOptions): Promise<TableChartSuggestionPayload> {
  const data = await readJson(`/api/projects/${projectId}/tables/${options.tableId}/chart/recommendations`, options.apiBaseUrl) as TableChartSuggestionPayload;
  if (!data || typeof data.reason !== 'string' || !Array.isArray(data.columns)) throw new Error('Некорректный ответ API графика');
  return data;
}
