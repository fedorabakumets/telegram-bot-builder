/**
 * @fileoverview Генерация Python-кода для раскладки клавиатуры
 *
 * Преобразует keyboardLayout в Python-код для builder.adjust().
 *
 * @module lib/bot-generator/Keyboard/generateKeyboardLayoutCode
 */

import { KeyboardLayout } from '@/components/editor/properties/types/keyboard-layout';

/**
 * Генерирует Python-код для builder.adjust() на основе keyboardLayout
 *
 * @param layout - Раскладка клавиатуры
 * @param totalButtons - Общее количество кнопок
 * @returns Python-код для adjust() или пустая строка
 *
 * @example
 * // Для layout.rows = [{buttonIds: ['1','2']}, {buttonIds: ['3']}]
 * generateAdjustCode(layout, 3) → "builder.adjust(2, 1)\n"
 */
export function generateAdjustCode(
  layout: KeyboardLayout,
  totalButtons: number
): string {
  // Если авто-раскладка, используем простое количество колонок
  if (layout.autoLayout || !layout.rows.length) {
    return `builder.adjust(${layout.columns})\n`;
  }

  // Генерируем adjust() с количеством кнопок в каждом ряду
  const rowSizes = layout.rows.map(row => row.buttonIds.length);
  return `builder.adjust(${rowSizes.join(', ')})\n`;
}
