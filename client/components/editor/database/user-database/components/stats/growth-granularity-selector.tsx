/**
 * @fileoverview Компактный переключатель гранулярности графиков аналитики
 * @description Кнопки 1ч / 3ч / 24ч / 7д / 30д / 12н / 12м
 */

import React from 'react';
import {
  ChartGranularity,
  CHART_GRANULARITY_LABELS,
  CHART_GRANULARITY_ORDER,
  CHART_GRANULARITY_TITLES,
} from '../../hooks/queries/chart-granularity';

/**
 * Пропсы переключателя гранулярности
 */
export interface GrowthGranularitySelectorProps {
  /** Текущее значение гранулярности */
  value: ChartGranularity;
  /** Обработчик изменения гранулярности */
  onChange: (g: ChartGranularity) => void;
}

/**
 * Компактный переключатель гранулярности графиков аналитики
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function GrowthGranularitySelector(
  props: GrowthGranularitySelectorProps,
): React.JSX.Element {
  const { value, onChange } = props;

  return (
    <div className="flex items-center gap-0.5 flex-wrap">
      {CHART_GRANULARITY_ORDER.map((g) => {
        const isActive = g === value;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            title={CHART_GRANULARITY_TITLES[g]}
            className={[
              'text-xs px-1.5 py-0.5 rounded transition-colors',
              isActive
                ? 'bg-primary/20 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {CHART_GRANULARITY_LABELS[g]}
          </button>
        );
      })}
    </div>
  );
}
