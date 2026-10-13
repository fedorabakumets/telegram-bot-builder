/**
 * @fileoverview Загрузка серверного графика таблицы.
 * @module editor/analytics/table-chart/use-table-chart-query
 */
import { useQuery } from '@tanstack/react-query';
import { fetchTableChart } from '@/components/editor/tables/api/table-chart-api';
import type { TableAggregation } from './chart-types';

/**
 * Загружает точки графика без передачи всех строк в браузер.
 * @param projectId - Проект.
 * @param tableId - Таблица.
 * @param xColumnId - Столбец групп.
 * @param yColumnId - Столбец значений.
 * @param aggregation - Способ подсчёта.
 * @returns Результат запроса.
 */
export function useTableChartQuery(
  projectId: number, tableId: number | null, xColumnId: number | null, yColumnId: number | null, aggregation: TableAggregation,
) {
  return useQuery({
    queryKey: ['bot-table-chart', projectId, tableId, xColumnId, yColumnId, aggregation],
    queryFn: () => fetchTableChart(projectId, tableId!, xColumnId!, yColumnId!, aggregation),
    enabled: !!projectId && !!tableId && !!xColumnId && !!yColumnId,
  });
}
