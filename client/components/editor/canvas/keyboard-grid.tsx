/**
 * @fileoverview Компонент сетки клавиатуры
 *
 * Отображает кнопки сеткой с учётом раскладки из панели свойств.
 *
 * @module components/editor/canvas/keyboard-grid
 */

import React from 'react';
import { KeyboardLayout } from '@/components/editor/properties/types/keyboard-layout';
import { getKeyboardRows } from './utils/get-keyboard-layout';

/** Свойства компонента KeyboardGrid */
export interface KeyboardGridProps<T extends { id: string }> {
  /** Массив кнопок */
  buttons: T[];
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Количество колонок по умолчанию */
  defaultColumns?: number;
  /** Класс для каждой кнопки */
  buttonClassName?: string;
  /** Рендер кнопки */
  renderButton: (button: T) => React.ReactNode;
}

/**
 * Компонент сетки клавиатуры
 *
 * @component
 * @description Отображает кнопки сеткой с учётом keyboardLayout
 *
 * @template T - Тип кнопки с полем id
 * @param {KeyboardGridProps<T>} props - Свойства компонента
 * @returns {JSX.Element} Сетка кнопок
 */
export function KeyboardGrid<T extends { id: string }>({
  buttons,
  keyboardLayout,
  defaultColumns = 2,
  buttonClassName = '',
  renderButton,
}: KeyboardGridProps<T>) {
  const rows = getKeyboardRows(buttons, keyboardLayout, defaultColumns);

  if (rows.length === 0) return null;

  return (
    <div className="space-y-2">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}>
          {row.map(button => (
            <div key={button.id} className={buttonClassName}>
              {renderButton(button)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
