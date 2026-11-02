/**
 * @fileoverview Проверка параметров графика таблицы.
 */
import type { Request } from 'express';
import { TABLE_AGGREGATIONS, TABLE_CHART_LIMIT, type TableAggregation } from '../../../../shared/analytics/table-chart/types';

/** Разобранные параметры графика. */
export interface ParsedChartRequest {
  /** Проект. */
  projectId: number;
  /** Таблица. */
  tableId: number;
  /** Столбец групп. */
  xColumnId: number;
  /** Столбец значений. */
  yColumnId: number;
  /** Способ подсчёта. */
  aggregation: TableAggregation;
  /** Предел групп. */
  limit: number;
  /** Необязательная колонка даты для общего периода. */
  dateColumnId?: number;
  /** Включённая ISO-граница с часовым поясом. */
  from?: string;
  /** Исключённая ISO-граница с часовым поясом. */
  to?: string;
}

/**
 * Превращает значение в положительное целое.
 * @param value - Параметр запроса.
 * @returns Число или null.
 */
export function positiveInt(value: unknown): number | null {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Читает идентификаторы пути и параметры графика.
 * @param req - Запрос Express.
 * @returns Параметры или сообщение об ошибке.
 */
export function parseChartRequest(req: Request): ParsedChartRequest | { message: string } {
  const projectId = positiveInt(req.params.id);
  const tableId = positiveInt(req.params.tableId);
  const xColumnId = positiveInt(req.query.xColumnId);
  const yColumnId = positiveInt(req.query.yColumnId);
  if (!projectId || !tableId || !xColumnId || !yColumnId) return { message: 'Некорректные параметры графика' };
  const aggregation = req.query.aggregation === undefined ? 'count' : req.query.aggregation;
  if (typeof aggregation !== 'string' || !TABLE_AGGREGATIONS.includes(aggregation as TableAggregation)) return { message: 'Некорректный способ подсчёта' };
  const limit = req.query.limit === undefined ? TABLE_CHART_LIMIT : positiveInt(req.query.limit);
  if (!limit || limit > TABLE_CHART_LIMIT) return { message: 'Предел групп должен быть от 1 до 50' };
  const dateColumnId = req.query.dateColumnId === undefined ? undefined : positiveInt(req.query.dateColumnId);
  const from = req.query.from;
  const to = req.query.to;
  if (dateColumnId === null || (!dateColumnId && (from !== undefined || to !== undefined))) return { message: 'Выберите колонку даты для фильтра периода' };
  if (dateColumnId && (!validChartDate(from) || !validChartDate(to) || Date.parse(String(from)) >= Date.parse(String(to)))) return { message: 'Укажите корректные границы периода в ISO с часовым поясом' };
  return { projectId, tableId, xColumnId, yColumnId, aggregation: aggregation as TableAggregation, limit,
    ...(dateColumnId ? { dateColumnId, from: String(from), to: String(to) } : {}) };
}

/** Проверяет явную дату границы без неоднозначного локального времени. */
function validChartDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !Number.isFinite(Date.parse(value))) return false;
  const day = value.slice(0, 10);
  return new Date(`${day}T00:00:00Z`).toISOString().slice(0, 10) === day && Number(value.slice(11, 13)) < 24 && Number(value.slice(14, 16)) < 60 && Number(value.slice(17, 19)) < 60;
}

/**
 * Читает проект и таблицу для рекомендации.
 * @param req - Запрос Express.
 * @returns Идентификаторы или сообщение.
 */
export function parseSuggestionRequest(req: Request): { projectId: number; tableId: number } | { message: string } {
  const projectId = positiveInt(req.params.id);
  const tableId = positiveInt(req.params.tableId);
  if (!projectId || !tableId) return { message: 'Некорректные параметры графика' };
  return { projectId, tableId };
}
