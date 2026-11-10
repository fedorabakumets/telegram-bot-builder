/**
 * @fileoverview Сегмент-чипы фильтра диалогов: Все / Личные / Группы / Каналы
 * @module client/.../dialogs-tab/dialog-segment-chips
 */

import { cn } from '@/utils/utils';
import type { DialogKind } from './dialog-kind';

/** Пункты сегмента */
const SEGMENTS: ReadonlyArray<{ id: DialogKind; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'users', label: 'Личные' },
  { id: 'groups', label: 'Группы' },
  { id: 'channels', label: 'Каналы' },
];

/**
 * Пропсы чипов фильтра
 */
interface DialogSegmentChipsProps {
  /** Текущий сегмент */
  value: DialogKind;
  /** Смена сегмента */
  onChange: (kind: DialogKind) => void;
}

/**
 * Горизонтальные чипы фильтра типа диалога
 * @param props - Свойства компонента
 * @returns JSX ряд чипов
 */
export function DialogSegmentChips({
  value,
  onChange,
}: DialogSegmentChipsProps): React.JSX.Element {
  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto scrollbar-none px-3 py-2 border-b border-border/50 flex-shrink-0"
      role="tablist"
      aria-label="Тип диалогов"
    >
      {SEGMENTS.map((segment) => {
        const selected = value === segment.id;
        return (
          <button
            key={segment.id}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(segment.id)}
            className={cn(
              'shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-200'
                : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
