/** @fileoverview Единые русские подписи способов подсчёта и вертикальной оси графика. */
import type { TableAggregation } from './chart-types';

/** Названия способов подсчёта для настроек, оси и подсказок. */
export const TABLE_AGGREGATION_LABELS: Record<TableAggregation, string> = {
  count: 'Количество записей', sum: 'Сумма', avg: 'Среднее значение', min: 'Минимальное значение', max: 'Максимальное значение',
};

/**
 * Объясняет величину по оси Y без упоминания неиспользуемого столбца при подсчёте записей.
 * @param aggregation - Способ подсчёта.
 * @param columnTitle - Понятное название столбца со значениями.
 * @returns Подпись оси и значения во всплывающей подсказке.
 */
export function getTableChartValueLabel(aggregation: TableAggregation, columnTitle: string): string {
  return aggregation === 'count' ? TABLE_AGGREGATION_LABELS.count : `${TABLE_AGGREGATION_LABELS[aggregation]}: ${columnTitle}`;
}
