/**
 * @fileoverview Пресеты раскладок клавиатуры
 * @module components/editor/properties/utils/keyboard-presets
 */

import { KeyboardPreset } from '../types/keyboard-layout';

/** Список доступных пресетов раскладок */
export const KEYBOARD_PRESETS: KeyboardPreset[] = [
  { name: 'Одна колонка', columns: 1, description: 'Вертикальный список' },
  { name: 'Две колонки', columns: 2, description: 'Стандартная сетка' },
  { name: 'Три колонки', columns: 3, description: 'Компактный вид' },
  { name: 'Четыре колонки', columns: 4, description: 'Максимально компактно' },
];

/**
 * Получает пресет по количеству колонок
 * @param columns - Количество колонок
 * @returns Пресет или undefined
 */
export function getPresetByColumns(columns: number): KeyboardPreset | undefined {
  return KEYBOARD_PRESETS.find(preset => preset.columns === columns);
}
