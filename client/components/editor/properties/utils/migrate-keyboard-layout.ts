/**
 * @fileoverview Утилита миграции keyboardLayout для существующих узлов
 *
 * Автоматически создаёт keyboardLayout для узлов, где его нет.
 *
 * @module components/editor/properties/utils/migrate-keyboard-layout
 */

import { KeyboardLayout } from '../types/keyboard-layout';

/**
 * Создаёт keyboardLayout для узла, если его нет
 *
 * @param buttons - Массив кнопок узла
 * @param existingLayout - Существующая раскладка (опционально)
 * @param defaultColumns - Количество колонок по умолчанию (2)
 * @returns keyboardLayout для узла
 */
export function migrateKeyboardLayout(
  buttons: Array<{ id: string }>,
  existingLayout: KeyboardLayout | undefined,
  defaultColumns: number = 2
): KeyboardLayout {
  // Если раскладка уже есть, возвращаем её
  if (existingLayout) {
    return existingLayout;
  }

  // Если кнопок нет, создаём пустую раскладку
  if (!buttons || buttons.length === 0) {
    return {
      rows: [],
      columns: defaultColumns,
      autoLayout: true,
    };
  }

  // Создаём раскладку из кнопок
  const rows: Array<{ buttonIds: string[] }> = [];
  for (let i = 0; i < buttons.length; i += defaultColumns) {
    const rowButtons = buttons.slice(i, i + defaultColumns);
    rows.push({ buttonIds: rowButtons.map(b => b.id) });
  }

  return {
    rows,
    columns: defaultColumns,
    autoLayout: true,
  };
}
