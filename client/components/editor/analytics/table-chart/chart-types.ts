/**
 * @fileoverview Типы для конструктора графиков по пользовательской таблице
 * @module editor/analytics/table-chart/chart-types
 */

/** Тип графика: столбчатый, линейный или круговой */
export type TableChartType = 'bar' | 'line' | 'pie';

/** Вид агрегации значений по оси Y */
export type TableAggregation = 'count' | 'sum' | 'avg' | 'min' | 'max';

/**
 * Точка данных для построения графика по таблице
 */
export interface TableChartPoint {
  /** Подпись категории (ось X) */
  label: string;
  /** Агрегированное значение (ось Y) */
  value: number;
}
