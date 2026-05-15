/**
 * @fileoverview Ячейка spreadsheet — inline-редактирование по клику
 * @module editor/tables/components/spreadsheet-cell
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/utils';

/** Пропсы ячейки */
interface SpreadsheetCellProps {
  /** Текущее значение */
  value: string;
  /** Обработчик изменения значения */
  onChange: (value: string) => void;
  /** Дополнительные классы */
  className?: string;
}

/**
 * Ячейка с inline-редактированием — клик активирует input
 * @param props - Пропсы компонента
 * @returns JSX элемент ячейки
 */
export function SpreadsheetCell({ value, onChange, className }: SpreadsheetCellProps) {
  /** Режим редактирования */
  const [editing, setEditing] = useState(false);
  /** Локальное значение при редактировании */
  const [localValue, setLocalValue] = useState(value);
  /** Ссылка на input */
  const inputRef = useRef<HTMLInputElement>(null);

  /** Фокус при входе в режим редактирования */
  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  /** Подтверждение изменения */
  const commit = () => {
    setEditing(false);
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setLocalValue(value); setEditing(false); }
        }}
        className={cn(
          'w-full h-full px-2 py-1 text-xs bg-background border-primary border outline-none',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full h-full px-2 py-1 text-xs cursor-text truncate leading-[22px]',
        className
      )}
      onDoubleClick={() => { setLocalValue(value); setEditing(true); }}
      onClick={() => { setLocalValue(value); setEditing(true); }}
    >
      {value || '\u00A0'}
    </div>
  );
}
