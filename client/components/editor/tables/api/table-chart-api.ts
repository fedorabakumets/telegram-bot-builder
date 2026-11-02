/**
 * @fileoverview Запрос уже посчитанного графика таблицы.
 * @module editor/tables/api/table-chart-api
 */
import { apiRequest } from '@/queryClient';
import type { TableAggregation } from '@shared/analytics/table-chart/types';
import type { TableChartPayload } from '@shared/analytics/table-chart/payload';
/** Необязательное ограничение строк по общей дате отчёта. */
export interface TableChartDateFilter {
  /** Столбец с датой. */ dateColumnId: number;
  /** Включённая граница UTC. */ from: string;
  /** Исключённая граница UTC. */ to: string;
}

/**
 * Загружает группы таблицы с сервера.
 * @param projectId - Проект.
 * @param tableId - Таблица.
 * @param xColumnId - Столбец групп.
 * @param yColumnId - Столбец значений.
 * @param aggregation - Способ подсчёта.
 * @returns Точки и пояснения.
 */
export function fetchTableChart(
  projectId: number, tableId: number, xColumnId: number, yColumnId: number, aggregation: TableAggregation,
  dateFilter?: TableChartDateFilter,
): Promise<TableChartPayload> {
  const params = new URLSearchParams({ xColumnId: String(xColumnId), yColumnId: String(yColumnId), aggregation });
  if (dateFilter) { params.set('dateColumnId', String(dateFilter.dateColumnId)); params.set('from', dateFilter.from); params.set('to', dateFilter.to); }
  return apiRequest('GET', `/api/projects/${projectId}/tables/${tableId}/chart?${params}`);
}
