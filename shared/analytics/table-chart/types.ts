/**
 * @fileoverview Контракты графика по пользовательской таблице.
 */

/** Допустимые способы подсчёта внутри группы. */
export const TABLE_AGGREGATIONS = ['count', 'sum', 'avg', 'min', 'max'] as const;

/** Способ подсчёта значений. */
export type TableAggregation = typeof TABLE_AGGREGATIONS[number];

/** Вид рисунка: столбцы, линия или круг. */
export type TableChartType = 'bar' | 'line' | 'pie';

/** Точка графика после группировки. */
export interface TableChartPoint {
  /** Подпись группы. */
  label: string;
  /** Итог группы. */
  value: number;
}

/** Максимум групп в одном ответе. */
export const TABLE_CHART_LIMIT = 50;

/** Доля чисел, начиная с которой столбец считается числовым. */
export const TABLE_CHART_NUMERIC_THRESHOLD = 0.8;

/** Подпись пустой категории. */
export const TABLE_CHART_EMPTY_LABEL = '—';
