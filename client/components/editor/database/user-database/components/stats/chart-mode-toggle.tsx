/**
 * @fileoverview Переключатель режима графика: за период / накопительно
 * @description Две кнопки — CalendarDays (за период) и TrendingUp (накопительно),
 *              стиль совпадает с ActivityGranularitySelector.
 */

import React from 'react';
import { CalendarDays, TrendingUp } from 'lucide-react';

/**
 * Режим отображения графика
 */
export type ChartMode = 'period' | 'cumulative';

/**
 * Пропсы компонента ChartModeToggle
 */
export interface ChartModeToggleProps {
  /** Текущий режим графика */
  value: ChartMode;
  /** Обработчик смены режима */
  onChange: (mode: ChartMode) => void;
}

/**
 * Конфигурация кнопок переключателя
 */
const MODES: Array<{ mode: ChartMode; title: string; Icon: React.ElementType }> = [
  { mode: 'period',     title: 'За период',    Icon: CalendarDays },
  { mode: 'cumulative', title: 'Накопительно', Icon: TrendingUp   },
];

/**
 * Компактный переключатель режима графика (за период / накопительно)
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function ChartModeToggle({ value, onChange }: ChartModeToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5">
      {MODES.map(({ mode, title, Icon }) => {
        const isActive = mode === value;
        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
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
