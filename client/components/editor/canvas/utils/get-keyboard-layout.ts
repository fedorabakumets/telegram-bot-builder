/**
 * @fileoverview Утилита для получения раскладки кнопок
 *
 * Преобразует массив кнопок в структуру рядов на основе keyboardLayout.
 *
 * @module components/editor/canvas/utils/get-keyboard-layout
 */

import { KeyboardLayout } from '@/components/editor/properties/types/keyboard-layout';

/**
 * Получает массив кнопок, распределённых по рядам
 *
 * @param buttons - Массив кнопок
 * @param keyboardLayout - Раскладка клавиатуры (опционально)
 * @param defaultColumns - Количество колонок по умолчанию (2)
 * @returns Массив рядов с кнопками
 *
 * @example
 * // Если keyboardLayout не задан, кнопки распределяются равномерно
 * const rows = getKeyboardRows(buttons, undefined, 2);
 * // [[btn1, btn2], [btn3, btn4], ...]
 */
export function getKeyboardRows<T extends { id: string }>(
  buttons: T[],
  keyboardLayout?: KeyboardLayout,
  defaultColumns: number = 2
): T[][] {
  if (!buttons || buttons.length === 0) return [];

  // Если есть keyboardLayout с ручным расположением
  if (keyboardLayout && !keyboardLayout.autoLayout && keyboardLayout.rows.length > 0) {
    const rows: T[][] = [];
    
    for (const row of keyboardLayout.rows) {
      const rowButtons = row.buttonIds
        .map(id => buttons.find(b => b.id === id))
        .filter((b): b is T => b !== undefined);
      
      if (rowButtons.length > 0) {
        rows.push(rowButtons);
      }
    }
    
    return rows;
  }

  // Автоматическое распределение
  const columns = keyboardLayout?.columns || defaultColumns;
  const rows: T[][] = [];
  
  for (let i = 0; i < buttons.length; i += columns) {
    rows.push(buttons.slice(i, i + columns));
  }
  
  return rows;
}
