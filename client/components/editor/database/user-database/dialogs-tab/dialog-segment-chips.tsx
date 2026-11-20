/**
 * @fileoverview Сегмент-чипы фильтра диалогов: Все / Личные / Группы / Каналы
 * @module client/.../dialogs-tab/dialog-segment-chips
 */

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
      className="dialogs-segments"
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
            className="dialogs-segment"
          >
            {segment.label}
          </button>
        );
      })}
    </div>
  );
}
