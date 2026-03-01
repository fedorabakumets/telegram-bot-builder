/**
 * @fileoverview Утилиты для работы с раскладкой клавиатуры
 * @module components/editor/properties/utils/keyboard-layout-utils
 */

import { Button } from '@/lib/bot-generator';
import { KeyboardLayout, KeyboardRow } from '../types/keyboard-layout';

/**
 * Создаёт раскладку из массива кнопок
 * @param buttons - Массив кнопок
 * @param columns - Количество колонок
 * @returns Раскладка клавиатуры
 */
export function createLayoutFromButtons(buttons: Button[], columns: number): KeyboardLayout {
  const rows: KeyboardRow[] = [];
  
  for (let i = 0; i < buttons.length; i += columns) {
    const rowButtons = buttons.slice(i, i + columns);
    rows.push({ buttonIds: rowButtons.map(b => b.id) });
  }
  
  return { rows, columns, autoLayout: true };
}

/**
 * Обновляет раскладку после изменения количества колонок
 * @param layout - Текущая раскладка
 * @param buttons - Все кнопки
 * @param newColumns - Новое количество колонок
 * @returns Обновлённая раскладка
 */
export function updateLayoutColumns(layout: KeyboardLayout, buttons: Button[], newColumns: number): KeyboardLayout {
  if (layout.autoLayout) {
    return createLayoutFromButtons(buttons, newColumns);
  }
  
  const allButtonIds = layout.rows.flatMap(row => row.buttonIds);
  const rows: KeyboardRow[] = [];
  
  for (let i = 0; i < allButtonIds.length; i += newColumns) {
    rows.push({ buttonIds: allButtonIds.slice(i, i + newColumns) });
  }
  
  return { rows, columns: newColumns, autoLayout: layout.autoLayout };
}

/**
 * Перемещает кнопку между рядами
 * @param layout - Текущая раскладка
 * @param buttonId - ID перемещаемой кнопки
 * @param toRow - Индекс целевого ряда
 * @param toIndex - Позиция в ряду
 * @returns Новая раскладка
 */
export function moveButton(layout: KeyboardLayout, buttonId: string, toRow: number, toIndex: number): KeyboardLayout {
  const newRows = layout.rows.map(row => ({ ...row, buttonIds: [...row.buttonIds] }));
  
  // Находим и удаляем кнопку из старого места
  let fromRow = -1;
  let fromIndex = -1;
  
  for (let r = 0; r < newRows.length; r++) {
    const idx = newRows[r].buttonIds.indexOf(buttonId);
    if (idx !== -1) {
      fromRow = r;
      fromIndex = idx;
      newRows[r].buttonIds.splice(idx, 1);
      break;
    }
  }
  
  if (fromRow === -1) return layout;
  
  // Удаляем пустые ряды
  for (let r = newRows.length - 1; r >= 0; r--) {
    if (newRows[r].buttonIds.length === 0) {
      newRows.splice(r, 1);
    }
  }
  
  // Вставляем кнопку в новое место
  if (toRow >= 0 && toRow < newRows.length) {
    newRows[toRow].buttonIds.splice(toIndex, 0, buttonId);
  } else {
    newRows.push({ buttonIds: [buttonId] });
  }
  
  return { rows: newRows, columns: layout.columns, autoLayout: layout.autoLayout };
}
