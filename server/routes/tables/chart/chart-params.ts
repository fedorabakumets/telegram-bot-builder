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
  return { projectId, tableId, xColumnId, yColumnId, aggregation: aggregation as TableAggregation, limit };
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
