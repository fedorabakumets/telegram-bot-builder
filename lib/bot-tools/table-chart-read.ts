/**
 * @fileoverview Проверка параметров и ответа графика таблицы.
 */
import { apiFetch } from './api-fetch.ts';
import { TABLE_AGGREGATIONS, TABLE_CHART_LIMIT, type TableAggregation, type TableChartPoint } from '../../shared/analytics/table-chart/types.ts';
import type { TableChartPayload } from '../../shared/analytics/table-chart/payload.ts';
import type { TableChartSuggestionPayload } from '../../shared/analytics/table-chart/suggest.ts';

/** Параметры чтения графика. */
export interface TableChartReadOptions {
  /** Колонка даты для фильтрации. */
  dateColumnId?: number;
  /** Включённая ISO-граница с часовым поясом. */
  from?: string;
  /** Исключённая ISO-граница с часовым поясом. */
  to?: string;
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
 * Проверяет согласованность фильтра периода до обращения к API.
 * @param options - Параметры графика.
 * @returns Признак корректности.
 */
function validDateFilter(options: TableChartReadOptions): boolean {
  if (options.dateColumnId === undefined) return options.from === undefined && options.to === undefined;
  /** Проверяет явный часовой пояс и конечное значение даты. */
  const explicit = (value: string | undefined) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  return positive(options.dateColumnId) && explicit(options.from) && explicit(options.to) && Date.parse(options.from!) < Date.parse(options.to!);
}

/**
 * Проверяет параметры до обращения к API.
 * @param projectId - Проект.
 * @param options - Параметры графика.
 * @returns Признак допустимого запроса.
 */
export function validTableChartOptions(projectId: number, options: TableChartReadOptions): boolean {
  return positive(projectId) && positive(options.tableId) && positive(options.xColumnId) && positive(options.yColumnId) &&
    TABLE_AGGREGATIONS.includes(options.aggregation ?? 'count') && validDateFilter(options) &&
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
  if (options.dateColumnId !== undefined) { params.set('dateColumnId', String(options.dateColumnId)); params.set('from', options.from!); params.set('to', options.to!); }
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
