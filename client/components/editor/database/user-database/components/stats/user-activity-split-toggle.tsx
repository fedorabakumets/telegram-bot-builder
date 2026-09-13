/**
 * @fileoverview Переключатель режима: все активные / новички и вернувшиеся
 * @module client/components/editor/database/user-database/components/stats/user-activity-split-toggle
 */

import React from 'react';
import { Users, UserPlus } from 'lucide-react';

/**
 * Режим отображения активности пользователей
 */
export type UserActivitySplitMode = 'total' | 'split';

/**
 * Пропсы переключателя
 */
export interface UserActivitySplitToggleProps {
  /** Текущий режим */
  value: UserActivitySplitMode;
  /** Обработчик смены режима */
  onChange: (mode: UserActivitySplitMode) => void;
}

/** Кнопки переключателя */
const MODES: Array<{
  mode: UserActivitySplitMode;
  title: string;
  Icon: React.ElementType;
}> = [
  { mode: 'total', title: 'Все активные', Icon: Users },
  { mode: 'split', title: 'Новички и вернувшиеся', Icon: UserPlus },
];

/**
 * Компактный переключатель режима активности пользователей
 * @param props - Пропсы компонента
 * @returns JSX элемент переключателя
 */
export function UserActivitySplitToggle({
  value,
  onChange,
}: UserActivitySplitToggleProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-0.5">
      {MODES.map(({ mode, title, Icon }) => {
        const isActive = value === mode;
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
