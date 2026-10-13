/**
 * @fileoverview Запрос уже посчитанного графика таблицы.
 * @module editor/tables/api/table-chart-api
 */
import { apiRequest } from '@/queryClient';
import type { TableAggregation } from '@shared/analytics/table-chart/types';
import type { TableChartPayload } from '@shared/analytics/table-chart/payload';

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
): Promise<TableChartPayload> {
  const params = new URLSearchParams({ xColumnId: String(xColumnId), yColumnId: String(yColumnId), aggregation });
  return apiRequest('GET', `/api/projects/${projectId}/tables/${tableId}/chart?${params}`);
}
