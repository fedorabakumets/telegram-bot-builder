/**
 * @fileoverview Ячейка spreadsheet с клавиатурной навигацией (Tab/Enter/Escape/стрелки)
 * @module editor/tables/components/spreadsheet-cell
 */

import { useState, useRef, useEffect } from 'react';
import { cn } from '@/utils/utils';

/** Направление навигации между ячейками */
export type NavigateDirection = 'right' | 'left' | 'down' | 'up';

/** Пропсы ячейки */
interface SpreadsheetCellProps {
  /** Текущее значение */
  value: string;
  /** Обработчик изменения значения */
  onChange: (value: string) => void;
  /** Ячейка сейчас в фокусе (активна для редактирования) */
  isFocused: boolean;
  /** Обработчик навигации к соседней ячейке */
  onNavigate: (direction: NavigateDirection) => void;
  /** Обработчик клика — установить фокус на эту ячейку */
  onFocus: () => void;
  /** Обработчик снятия фокуса (Escape) */
  onBlurCell: () => void;
  /** Дополнительные классы */
  className?: string;
}

/**
 * Ячейка с inline-редактированием и клавиатурной навигацией
 * @param props - Пропсы компонента
 * @returns JSX элемент ячейки
 */
export function SpreadsheetCell({
  value,
  onChange,
  isFocused,
  onNavigate,
  onFocus,
  onBlurCell,
  className,
}: SpreadsheetCellProps) {
  /** Локальное значение при редактировании */
  const [localValue, setLocalValue] = useState(value);
  /** Ссылка на input */
  const inputRef = useRef<HTMLInputElement>(null);

  /** Синхронизация при смене внешнего value */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /** Автофокус при активации ячейки */
  useEffect(() => {
    if (isFocused && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isFocused]);

  /** Подтверждение изменения */
  const commit = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  /** Обработчик клавиш навигации */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      onNavigate(e.shiftKey ? 'left' : 'right');
    } else if (e.key === 'Enter') {
      e.preventDefault();
      commit();
      onNavigate(e.shiftKey ? 'up' : 'down');
    } else if (e.key === 'Escape') {
      setLocalValue(value);
      onBlurCell();
    }
  };

  /** Обработчик потери фокуса (клик вне ячейки) */
  const handleBlur = () => {
    commit();
  };

  if (isFocused) {
    return (
      <input
        ref={inputRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full h-full px-2 py-1 text-xs bg-background border-primary border outline-none',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full h-full px-2 py-1 text-xs cursor-text truncate leading-[22px]',
        className,
      )}
      onClick={() => { setLocalValue(value); onFocus(); }}
    >
      {value || '\u00A0'}
    </div>
  );
}
