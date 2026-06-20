/**
 * @fileoverview Чистые функции клиентской агрегации данных таблицы для графиков
 * @module editor/analytics/table-chart/aggregate-table-data
 */

import { TableAggregation, TableChartPoint } from './chart-types';

/** Структурный тип строки таблицы: важно только поле data */
type TableRowLike = { data: Record<string, string> };

/** Максимальное число категорий на графике */
const MAX_CATEGORIES = 50;

/** Доля числовых значений, при которой колонка считается числовой */
const NUMERIC_THRESHOLD = 0.8;

/**
 * Определяет, является ли колонка числовой
 * @param rows - Строки таблицы (учитывается только поле data)
 * @param columnId - Строковый ключ колонки в data
 * @returns true, если ≥80% непустых значений парсятся в число; иначе false
 */
export function isNumericColumn(rows: TableRowLike[], columnId: string): boolean {
  let nonEmpty = 0;
  let numeric = 0;
  for (const row of rows) {
    const raw = row.data?.[columnId];
    if (raw == null || raw.trim() === '') continue;
    nonEmpty++;
    if (!Number.isNaN(parseFloat(raw))) numeric++;
  }
  if (nonEmpty === 0) return false;
  return numeric / nonEmpty >= NUMERIC_THRESHOLD;
}

/**
 * Применяет агрегацию к собранным числовым значениям группы
 * @param agg - Вид агрегации
 * @param count - Число строк в группе
 * @param nums - Числовые значения Y внутри группы
 * @returns Итоговое агрегированное значение
 */
function applyAggregation(agg: TableAggregation, count: number, nums: number[]): number {
  if (agg === 'count') return count;
  if (nums.length === 0) return 0;
  if (agg === 'sum') return nums.reduce((s, n) => s + n, 0);
  if (agg === 'avg') return nums.reduce((s, n) => s + n, 0) / nums.length;
  if (agg === 'min') return Math.min(...nums);
  return Math.max(...nums);
}

/**
 * Группирует строки по категории (ось X) и агрегирует значения (ось Y)
 * @param rows - Строки таблицы (учитывается только поле data)
 * @param xColumnId - Строковый ключ колонки-категории
 * @param yColumnId - Строковый ключ колонки-значения
 * @param aggregation - Вид агрегации
 * @returns Массив точек, отсортированный по value DESC, ограниченный топ-50
 */
export function aggregateTableData(
  rows: TableRowLike[],
  xColumnId: string,
  yColumnId: string,
  aggregation: TableAggregation,
): TableChartPoint[] {
  /** Накопители по категориям: число строк и числовые значения Y */
  const groups = new Map<string, { count: number; nums: number[] }>();

  for (const row of rows) {
    const rawX = row.data?.[xColumnId];
    const label = rawX != null && rawX.trim() !== '' ? rawX : '—';
    let group = groups.get(label);
    if (!group) {
      group = { count: 0, nums: [] };
      groups.set(label, group);
    }
    group.count++;
    if (aggregation !== 'count') {
      const num = parseFloat(row.data?.[yColumnId]);
      if (!Number.isNaN(num)) group.nums.push(num);
    }
  }

  const points: TableChartPoint[] = [];
  for (const [label, group] of groups) {
    points.push({ label, value: applyAggregation(aggregation, group.count, group.nums) });
  }

  points.sort((a, b) => b.value - a.value);
  return points.slice(0, MAX_CATEGORIES);
}
