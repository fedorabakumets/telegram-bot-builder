/**
 * @fileoverview Легенда с цветными индикаторами для источников трафика
 * @description Отображает список источников с цветами и суммарным количеством
 */

import React from 'react';
import { MultiLineData } from './source-aggregation-utils';

/**
 * Пропсы компонента SourceLegend
 */
export interface SourceLegendProps {
  /** Данные источников для отображения */
  items: MultiLineData[];
}

/**
 * Вычисляет суммарное количество пользователей для источника
 * @param data - Массив точек прироста
 * @returns Суммарное количество
 */
function getTotalCount(data: Array<{ count: number }>): number {
  return data.reduce((sum, point) => sum + point.count, 0);
}

/**
 * Показывает источники с читаемыми числами и согласованными отступами.
 * @param props - Пропсы компонента
 * @returns JSX элемент легенды
 */
export function SourceLegend({ items }: SourceLegendProps): React.JSX.Element {
  if (!items || items.length === 0) return <></>;

  return (
    <div className="analytics-series-legend flex flex-wrap gap-3 text-sm">
      {items.map(item => {
        const total =
          typeof item.legendTotal === 'number'
            ? item.legendTotal
            : getTotalCount(item.data);
        return (
          <div key={item.name} className="flex min-w-0 items-center gap-2">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate">{item.name}</span>
            <span className="font-medium text-foreground tabular-nums">{total.toLocaleString('ru-RU')}</span>
          </div>
        );
      })}
    </div>
  );
}
