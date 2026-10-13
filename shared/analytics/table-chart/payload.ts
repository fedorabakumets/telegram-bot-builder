/**
 * @fileoverview Сборка ответа графика из уже посчитанных групп.
 */
import { tableChartWarnings } from './warnings';
import { TABLE_CHART_LIMIT, type TableAggregation, type TableChartPoint } from './types';

/** Ответ графика для интерфейса и MCP. */
export interface TableChartPayload {
  /** Проект. */
  project_id: number;
  /** Таблица. */
  table_id: number;
  /** Название таблицы. */
  table_name: string;
  /** Столбец групп. */
  x_column_id: number;
  /** Название столбца групп. */
  x_column_name: string;
  /** Столбец значений. */
  y_column_id: number;
  /** Название столбца значений. */
  y_column_name: string;
  /** Фактический способ подсчёта. */
  aggregation: TableAggregation;
  /** Можно ли считать сумму и среднее. */
  y_is_numeric: boolean;
  /** Число строк таблицы. */
  row_count: number;
  /** Число групп до сокращения. */
  group_count: number;
  /** Применённый предел групп. */
  limit: number;
  /** Ответ сокращён до предела. */
  truncated: boolean;
  /** Точки графика. */
  points: TableChartPoint[];
  /** Пояснения к чтению графика. */
  warnings: string[];
}

/** Части ответа, которые приходят из базы. */
export interface TableChartParts {
  /** Название таблицы. */
  tableName: string;
  /** Название столбца групп. */
  xName: string;
  /** Название столбца значений. */
  yName: string;
  /** Признак числового столбца. */
  yIsNumeric: boolean;
  /** Число строк. */
  rowCount: number;
  /** Число групп. */
  groupCount: number;
  /** Средняя длина подписи. */
  avgLabelLength: number;
  /** Уже отсортированные точки. */
  points: TableChartPoint[];
  /** Подсчёт заменён на количество. */
  coercedToCount: boolean;
}

/**
 * Собирает полный ответ и пояснения.
 * @param ids - Проект, таблица, столбцы и подсчёт.
 * @param parts - Итоги базы.
 * @returns Ответ графика.
 */
export function buildTableChartPayload(
  ids: { projectId: number; tableId: number; xColumnId: number; yColumnId: number; aggregation: TableAggregation; limit: number },
  parts: TableChartParts,
): TableChartPayload {
  const warnings = tableChartWarnings({
    groupCount: parts.groupCount, rowCount: parts.rowCount, avgLabelLength: parts.avgLabelLength, coercedToCount: parts.coercedToCount,
  });
  return {
    project_id: ids.projectId, table_id: ids.tableId, table_name: parts.tableName,
    x_column_id: ids.xColumnId, x_column_name: parts.xName, y_column_id: ids.yColumnId, y_column_name: parts.yName,
    aggregation: ids.aggregation, y_is_numeric: parts.yIsNumeric, row_count: parts.rowCount, group_count: parts.groupCount,
    limit: ids.limit, truncated: parts.groupCount > Math.min(ids.limit, TABLE_CHART_LIMIT), points: parts.points, warnings,
  };
}
