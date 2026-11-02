/** @fileoverview Подписи осей с выбранными данными непосредственно вокруг области графика. */
import type { ReactNode } from 'react';
import type { TableChartType } from './chart-types';

/**
 * Обозначает вертикальную ось сверху слева, горизонтальную снизу; для круговой диаграммы поясняет группы.
 * @param props - Вид графика, названия данных и область построения.
 * @returns График с видимыми и доступными подписями осей.
 */
export function TableChartAxes({ chartType, categoryLabel, valueLabel, children, details }: {
  /** Вид отображения данных. */
  chartType: TableChartType;
  /** Название столбца группировки. */
  categoryLabel: string;
  /** Название рассчитанного показателя. */
  valueLabel: string;
  /** Область построения диаграммы. */
  children: ReactNode;
  /** Раскрытые значения и доступный список под подписями осей. */
  details?: ReactNode;
}) {
  const cartesian = chartType !== 'pie';
  return <figure className="min-w-0 space-y-3" aria-label={cartesian ? `Ось X: ${categoryLabel}. Ось Y: ${valueLabel}` : `Группы: ${categoryLabel}. Показатель: ${valueLabel}`}>
    <div className="text-pretty text-sm text-muted-foreground"><strong className="font-semibold text-foreground">{cartesian ? 'Y ↑' : 'Показатель:'}</strong> {valueLabel}</div>
    {children}
    <figcaption className="text-pretty text-center text-sm text-muted-foreground"><strong className="font-semibold text-foreground">{cartesian ? 'X →' : 'Группы:'}</strong> {categoryLabel}</figcaption>
    {details}
  </figure>;
}
