/**
 * @fileoverview Переключатель режима графика активности: все / входящие+исходящие
 * @description Две кнопки — MessageSquare (все сообщения) и ArrowLeftRight (раздельно),
 *              стиль совпадает с SourceModeToggle.
 */

import React from 'react';
import { MessageSquare, ArrowLeftRight } from 'lucide-react';

/**
 * Режим отображения активности сообщений
 */
export type ActivitySplitMode = 'total' | 'split';

/**
 * Пропсы компонента ActivitySplitToggle
 */
export interface ActivitySplitToggleProps {
  /** Текущий режим */
  value: ActivitySplitMode;
  /** Обработчик смены режима */
  onChange: (mode: ActivitySplitMode) => void;
}

/**
 * Конфигурация кнопок переключателя
 */
const MODES: Array<{ mode: ActivitySplitMode; title: string; Icon: React.ElementType }> = [
  { mode: 'total', title: 'Все сообщения',              Icon: MessageSquare  },
  { mode: 'split', title: 'Входящие и исходящие',       Icon: ArrowLeftRight },
];

/**
 * Компактный переключатель режима отображения активности
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function ActivitySplitToggle({ value, onChange }: ActivitySplitToggleProps): React.JSX.Element {
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
