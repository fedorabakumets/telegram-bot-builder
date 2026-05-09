/**
 * @fileoverview Переключатель режима отображения: общий / по источникам
 * @description Две кнопки — Users (общий) и GitBranch (по источникам),
 *              стиль совпадает с ChartModeToggle.
 */

import React from 'react';
import { Users, GitBranch } from 'lucide-react';

/**
 * Режим отображения данных
 */
export type SourceMode = 'total' | 'by-source';

/**
 * Пропсы компонента SourceModeToggle
 */
export interface SourceModeToggleProps {
  /** Текущий режим отображения */
  value: SourceMode;
  /** Обработчик смены режима */
  onChange: (mode: SourceMode) => void;
}

/**
 * Конфигурация кнопок переключателя
 */
const MODES: Array<{ mode: SourceMode; title: string; Icon: React.ElementType }> = [
  { mode: 'total',     title: 'Общий',        Icon: Users     },
  { mode: 'by-source', title: 'По источникам', Icon: GitBranch },
];

/**
 * Компактный переключатель режима отображения (общий / по источникам)
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function SourceModeToggle({ value, onChange }: SourceModeToggleProps): React.JSX.Element {
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
