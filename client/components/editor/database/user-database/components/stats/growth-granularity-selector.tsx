/**
 * @fileoverview Компактный переключатель гранулярности для графика прироста пользователей
 * @description Отображает кнопки [1м] [5м] [1ч] [1д] [7д] [30д], активная подсвечена
 */

import React from 'react';
import { GrowthGranularity } from '../../hooks/queries/use-growth';

/**
 * Пропсы компонента GrowthGranularitySelector
 */
export interface GrowthGranularitySelectorProps {
  /** Текущее значение гранулярности */
  value: GrowthGranularity;
  /** Обработчик изменения гранулярности */
  onChange: (g: GrowthGranularity) => void;
}

/**
 * Метка кнопки для каждого значения гранулярности.
 * Показывает период охвата, чтобы пользователь понимал
 * за какой промежуток времени отображается график.
 */
const GROWTH_GRANULARITY_LABELS: Record<GrowthGranularity, string> = {
  '1m':  '1ч',
  '5m':  '3ч',
  '1h':  '24ч',
  '1d':  '30д',
  '7d':  '12н',
  '30d': '12м',
};

/**
 * Подсказка при наведении — поясняет шаг и период охвата
 */
const GROWTH_GRANULARITY_TITLES: Record<GrowthGranularity, string> = {
  '1m':  'Последний час, шаг 1 минута',
  '5m':  'Последние 3 часа, шаг 5 минут',
  '1h':  'Последние 24 часа, шаг 1 час',
  '1d':  'Последние 30 дней, шаг 1 день',
  '7d':  'Последние 12 недель, шаг 1 неделя',
  '30d': 'Последние 12 месяцев, шаг 1 месяц',
};

/** Порядок отображения кнопок */
const GROWTH_GRANULARITY_ORDER: GrowthGranularity[] = ['1m', '5m', '1h', '1d', '7d', '30d'];

/**
 * Компактный переключатель гранулярности графика прироста пользователей
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function GrowthGranularitySelector(
  props: GrowthGranularitySelectorProps,
): React.JSX.Element {
  const { value, onChange } = props;

  return (
    <div className="flex items-center gap-0.5">
      {GROWTH_GRANULARITY_ORDER.map((g) => {
        const isActive = g === value;
        return (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            title={GROWTH_GRANULARITY_TITLES[g]}
            className={[
              'text-xs px-1.5 py-0.5 rounded transition-colors',
              isActive
                ? 'bg-primary/20 text-primary font-medium'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            {GROWTH_GRANULARITY_LABELS[g]}
          </button>
        );
      })}
    </div>
  );
}
