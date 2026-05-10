/**
 * @fileoverview Переключатель типа графика: столбчатый / линейный
 * @description Две кнопки-иконки — BarChart2 (bar) и LineChart (line),
 *              стиль идентичен ChartModeToggle.
 */

import React from 'react';
import { BarChart2, LineChart } from 'lucide-react';

/**
 * Тип графика: столбчатый или линейный
 */
export type ChartType = 'bar' | 'line';

/**
 * Пропсы компонента ChartTypeToggle
 */
export interface ChartTypeToggleProps {
  /** Текущий тип графика */
  value: ChartType;
  /** Обработчик смены типа */
  onChange: (type: ChartType) => void;
}

/**
 * Конфигурация кнопок переключателя типа графика
 */
const TYPES: Array<{ type: ChartType; title: string; Icon: React.ElementType }> = [
  { type: 'bar',  title: 'Столбчатый', Icon: BarChart2  },
  { type: 'line', title: 'Линейный',   Icon: LineChart  },
];

/**
 * Компактный переключатель типа графика (столбчатый / линейный)
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5">
      {TYPES.map(({ type, title, Icon }) => {
        const isActive = type === value;
        return (
          <button
            key={type}
            type="button"
            onClick={() => onChange(type)}
            title={title}
            className={[
              'flex items-center justify-center w-6 h-5 rounded transition-colors',
              isActive
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground',
            ].join(' ')}
          >
            <Icon className="w-3 h-3" />
          </button>
        );
      })}
    </div>
  );
}
