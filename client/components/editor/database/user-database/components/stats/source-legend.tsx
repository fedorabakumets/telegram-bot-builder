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
 * Легенда с цветными индикаторами для источников трафика
 * @param props - Пропсы компонента
 * @returns JSX элемент легенды
 */
export function SourceLegend({ items }: SourceLegendProps): React.JSX.Element {
  if (!items || items.length === 0) return <></>;

  return (
    <div className="flex flex-wrap gap-2 text-xs">
      {items.map(item => {
        const total = getTotalCount(item.data);
        return (
          <div key={item.name} className="flex items-center gap-1.5">
            <div
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-muted-foreground truncate">{item.name}</span>
            <span className="font-medium text-foreground tabular-nums">{total}</span>
          </div>
        );
      })}
    </div>
  );
}
