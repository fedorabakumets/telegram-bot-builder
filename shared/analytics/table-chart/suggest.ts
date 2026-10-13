/**
 * @fileoverview Подбор столбцов и вида графика по сводке таблицы.
 */
import type { TableAggregation, TableChartType } from './types';

/** Сводка одного столбца без содержимого ячеек. */
export interface TableColumnProfile {
  /** Идентификатор столбца. */
  id: number;
  /** Название столбца. */
  name: string;
  /** Число непустых ячеек. */
  filled: number;
  /** Число разных непустых значений. */
  distinctCount: number;
  /** Средняя длина непустого значения. */
  avgLength: number;
  /** Признак числового столбца. */
  isNumeric: boolean;
}

/** Рекомендация для графика. */
export interface TableChartSuggestion {
  /** Столбец групп. */
  xColumnId: number | null;
  /** Столбец значений. */
  yColumnId: number | null;
  /** Способ подсчёта. */
  aggregation: TableAggregation | null;
  /** Удобный вид рисунка. */
  chartType: TableChartType | null;
  /** Пояснение по-русски. */
  reason: string;
}

/** Ответ рекомендации для интерфейса и MCP. */
export interface TableChartSuggestionPayload {
  /** Проект. */
  project_id: number;
  /** Таблица. */
  table_id: number;
  /** Название таблицы. */
  table_name: string;
  /** Число строк. */
  row_count: number;
  /** Столбец групп. */
  x_column_id: number | null;
  /** Название столбца групп. */
  x_column_name: string | null;
  /** Столбец значений. */
  y_column_id: number | null;
  /** Название столбца значений. */
  y_column_name: string | null;
  /** Рекомендуемый подсчёт. */
  aggregation: TableAggregation | null;
  /** Рекомендуемый вид рисунка. */
  chart_type: TableChartType | null;
  /** Пояснение. */
  reason: string;
  /** Сводки столбцов. */
  columns: TableColumnProfile[];
}

/**
 * Оценивает, насколько столбец удобен как категория.
 * @param column - Сводка столбца.
 * @param rowCount - Число строк таблицы.
 * @returns Чем выше, тем лучше столбец подходит для групп.
 */
function categoryScore(column: TableColumnProfile, rowCount: number): number {
  if (column.distinctCount <= 1) return 0;
  let score = 100;
  if (column.distinctCount > 50) score -= 80;
  else if (column.distinctCount > 12) score -= 20;
  else score += 30;
  if (column.avgLength > 40) score -= 50;
  else if (column.avgLength > 24) score -= 15;
  if (column.filled === 0) score -= 40;
  if (rowCount > 0 && column.distinctCount / rowCount > 0.85 && column.distinctCount > 8) score -= 60;
  return score;
}

/**
 * Подбирает группу, значение, подсчёт и вид рисунка.
 * @param columns - Сводки столбцов по порядку.
 * @param rowCount - Число строк.
 * @returns Рекомендация с пояснением.
 */
export function suggestTableChart(columns: TableColumnProfile[], rowCount: number): TableChartSuggestion {
  if (columns.length === 0) {
    return { xColumnId: null, yColumnId: null, aggregation: null, chartType: null, reason: 'В таблице нет столбцов для графика.' };
  }
  const category = [...columns].sort((a, b) => categoryScore(b, rowCount) - categoryScore(a, rowCount))[0];
  const value = columns.find(column => column.isNumeric && column.id !== category.id) ?? category;
  const aggregation: TableAggregation = value.isNumeric && value.id !== category.id ? 'sum' : 'count';
  const chartType: TableChartType = category.distinctCount > 0 && category.distinctCount <= 8 ? 'pie' : 'bar';
  const crowded = categoryScore(category, rowCount) < 40;
  const reason = crowded
    ? `Столбец «${category.name}» плохо подходит для групп: значения почти не повторяются или слишком длинные. Для значения взят «${value.name}».`
    : `Для групп подходит «${category.name}», для значения — «${value.name}». ${aggregation === 'sum' ? 'Столбец значения числовой, поэтому рекомендована сумма.' : 'Рекомендован подсчёт количества строк.'}`;
  return { xColumnId: category.id, yColumnId: value.id, aggregation, chartType, reason };
}

/**
 * Дополняет рекомендацию названиями и сведениями о таблице.
 * @param scope - Проект и таблица.
 * @param columns - Сводки столбцов.
 * @param suggestion - Выбранные столбцы и пояснение.
 * @returns Плоский ответ.
 */
export function buildSuggestionPayload(
  scope: { projectId: number; tableId: number; tableName: string; rowCount: number },
  columns: TableColumnProfile[],
  suggestion: TableChartSuggestion,
): TableChartSuggestionPayload {
  const nameOf = (id: number | null) => columns.find(column => column.id === id)?.name ?? null;
  return {
    project_id: scope.projectId, table_id: scope.tableId, table_name: scope.tableName, row_count: scope.rowCount,
    x_column_id: suggestion.xColumnId, y_column_id: suggestion.yColumnId,
    x_column_name: nameOf(suggestion.xColumnId), y_column_name: nameOf(suggestion.yColumnId),
    aggregation: suggestion.aggregation, chart_type: suggestion.chartType, reason: suggestion.reason, columns,
  };
}
