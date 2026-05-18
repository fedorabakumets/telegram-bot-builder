/**
 * @fileoverview Ячейка spreadsheet с клавиатурной навигацией (Tab/Escape/стрелки)
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
 * Ячейка с inline-редактированием через textarea и клавиатурной навигацией
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
  /** Ссылка на textarea */
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Индикатор сохранения */
  const [saved, setSaved] = useState(false);

  /** Синхронизация при смене внешнего value */
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  /** Автофокус при активации ячейки */
  useEffect(() => {
    if (isFocused && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isFocused]);

  /** Подтверждение изменения */
  const commit = () => {
    if (localValue !== value) {
      onChange(localValue);
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
  };

  /** Обработчик клавиш навигации */
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      commit();
      onNavigate(e.shiftKey ? 'left' : 'right');
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
      <textarea
        ref={textareaRef}
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        rows={Math.max(3, localValue.split('\n').length)}
        className={cn(
          'w-full px-2 py-1 text-xs bg-background border-primary border outline-none resize-y min-h-[60px]',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'w-full h-full px-2 py-1 text-xs cursor-text truncate leading-[22px] relative',
        className,
      )}
      onClick={() => { setLocalValue(value); onFocus(); }}
    >
      {value || '\u00A0'}
      {saved && (
        <span className="absolute right-1 top-1 text-[9px] text-green-500 font-medium animate-pulse">
          ✓
        </span>
      )}
    </div>
  );
}
