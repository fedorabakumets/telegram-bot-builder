/** @fileoverview Компактные настройки графика: период виден сразу, дополнительные режимы раскрываются по запросу. */
import { Children, type ReactNode } from 'react';

/**
 * Сохраняет график в центре внимания и не перегружает карточку переключателями.
 * @param props - Первый элемент выбора периода и остальные настройки.
 * @returns Панель периода с раскрываемыми дополнительными настройками.
 */
export function AnalyticsChartToolbar({ children }: {
  /** Период первым элементом, затем режимы представления. */
  children: ReactNode;
}) {
  const controls = Children.toArray(children);
  return <div className="analytics-chart-toolbar">
    {controls[0]}
    {controls.length > 1 && <details className="analytics-chart-settings">
      <summary>Настройки графика</summary>
      <div>{controls.slice(1)}</div>
    </details>}
  </div>;
}
