/**
 * @fileoverview Группировка строк таблицы для графика.
 */
import { leadingTableNumber } from './parse-number';
import {
  TABLE_CHART_EMPTY_LABEL, TABLE_CHART_LIMIT, TABLE_CHART_NUMERIC_THRESHOLD,
  type TableAggregation, type TableChartPoint,
} from './types';

/** Строка, из которой нужны только ячейки. */
type TableRowLike = { data: Record<string, string> };

/**
 * Проверяет, что не менее 80% непустых ячеек начинаются с числа.
 * @param rows - Строки таблицы.
 * @param columnId - Ключ столбца в данных строки.
 * @returns Признак числового столбца.
 */
export function isNumericColumn(rows: TableRowLike[], columnId: string): boolean {
  let filled = 0;
  let numeric = 0;
  for (const row of rows) {
    const raw = row.data?.[columnId];
    if (raw == null || raw.trim() === '') continue;
    filled += 1;
    if (leadingTableNumber(raw) !== null) numeric += 1;
  }
  return filled > 0 && numeric / filled >= TABLE_CHART_NUMERIC_THRESHOLD;
}

/**
 * Сводит числа группы к одному итогу. Пустой набор чисел даёт ноль.
 * @param aggregation - Способ подсчёта.
 * @param count - Число строк группы.
 * @param nums - Распознанные числа.
 * @returns Итог группы.
 */
function applyAggregation(aggregation: TableAggregation, count: number, nums: number[]): number {
  if (aggregation === 'count') return count;
  if (nums.length === 0) return 0;
  if (aggregation === 'sum') return nums.reduce((sum, value) => sum + value, 0);
  if (aggregation === 'avg') return nums.reduce((sum, value) => sum + value, 0) / nums.length;
  if (aggregation === 'min') return Math.min(...nums);
  return Math.max(...nums);
}

/**
 * Группирует строки и оставляет не больше 50 крупнейших групп.
 * @param rows - Строки таблицы.
 * @param xColumnId - Столбец групп.
 * @param yColumnId - Столбец значений.
 * @param aggregation - Способ подсчёта.
 * @returns Точки по убыванию итога.
 */
export function aggregateTableData(
  rows: TableRowLike[], xColumnId: string, yColumnId: string, aggregation: TableAggregation,
): TableChartPoint[] {
  const groups = new Map<string, { count: number; nums: number[] }>();
  for (const row of rows) {
    const rawLabel = row.data?.[xColumnId];
    const label = rawLabel != null && rawLabel.trim() !== '' ? rawLabel : TABLE_CHART_EMPTY_LABEL;
    const group = groups.get(label) ?? { count: 0, nums: [] };
    group.count += 1;
    if (aggregation !== 'count') {
      const num = leadingTableNumber(row.data?.[yColumnId]);
      if (num !== null) group.nums.push(num);
    }
    groups.set(label, group);
  }
  return [...groups].map(([label, group]) => ({ label, value: applyAggregation(aggregation, group.count, group.nums) }))
    .sort((a, b) => b.value - a.value || (a.label < b.label ? -1 : 1))
    .slice(0, TABLE_CHART_LIMIT);
}
