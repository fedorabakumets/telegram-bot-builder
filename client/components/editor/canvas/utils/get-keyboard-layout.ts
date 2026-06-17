/**
 * @fileoverview Утилита для получения раскладки кнопок
 *
 * Преобразует массив кнопок в структуру рядов на основе keyboardLayout.
 *
 * @module components/editor/canvas/utils/get-keyboard-layout
 */

import { KeyboardLayout } from '@/components/editor/properties/types/keyboard-layout';

/** Минимальная ширина узла keyboard на холсте (px), эквивалент `w-80` */
export const KEYBOARD_NODE_MIN_WIDTH = 320;

/** Максимальная ширина узла keyboard на холсте (px) */
export const KEYBOARD_NODE_MAX_WIDTH = 960;

/** Минимальная ширина одной ячейки кнопки в сетке (px) */
export const KEYBOARD_BUTTON_MIN_WIDTH = 156;

/** Горизонтальный padding узла `p-4` (px) */
export const KEYBOARD_NODE_HORIZONTAL_PADDING = 32;

/** Толщина `border-2` с двух сторон (px) */
export const KEYBOARD_NODE_BORDER_WIDTH = 4;

/** Расстояние `gap-2.5` между колонками (px) */
export const KEYBOARD_GRID_GAP = 10;

/** Оценка ширины одного символа в `text-sm` (px) */
const KEYBOARD_TEXT_CHAR_WIDTH = 7.5;

/** Внутренние отступы кнопки и место под иконку (px) */
const KEYBOARD_BUTTON_INNER_PADDING = 52;

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

/**
 * Оценивает минимальную ширину ячейки кнопки по длине текста.
 *
 * @param button - Кнопка с полем `text`
 * @returns Ширина ячейки в пикселях
 */
export function estimateKeyboardButtonCellWidth(button: { text?: string }): number {
  const textLength = button.text?.length ?? 0;
  const contentWidth = textLength * KEYBOARD_TEXT_CHAR_WIDTH + KEYBOARD_BUTTON_INNER_PADDING;
  return Math.max(KEYBOARD_BUTTON_MIN_WIDTH, Math.ceil(contentWidth));
}

/**
 * Вычисляет ширину ряда кнопок с учётом текста каждой кнопки.
 *
 * @param row - Ряд кнопок
 * @returns Ширина ряда в пикселях
 */
export function computeKeyboardRowWidth(row: { text?: string }[]): number {
  if (row.length === 0) return KEYBOARD_NODE_MIN_WIDTH;

  const cellsWidth = row.reduce((sum, button) => sum + estimateKeyboardButtonCellWidth(button), 0);
  const gapsWidth = (row.length - 1) * KEYBOARD_GRID_GAP;

  return cellsWidth + gapsWidth;
}

/**
 * Вычисляет ширину узла keyboard по рядам кнопок.
 *
 * @param rows - Ряды кнопок клавиатуры
 * @returns Ширина узла в пикселях
 */
export function computeKeyboardNodeWidthFromRows(rows: { text?: string }[][]): number {
  if (rows.length === 0) {
    return KEYBOARD_NODE_MIN_WIDTH;
  }

  const maxRowWidth = Math.max(...rows.map((row) => computeKeyboardRowWidth(row)));
  const total = maxRowWidth + KEYBOARD_NODE_HORIZONTAL_PADDING + KEYBOARD_NODE_BORDER_WIDTH;

  return Math.min(KEYBOARD_NODE_MAX_WIDTH, Math.max(KEYBOARD_NODE_MIN_WIDTH, total));
}
