/**
 * @fileoverview Утилиты миграции keyboardLayout
 *
 * Обрабатывает keyboardLayout при загрузке проекта.
 */

/**
 * Мигрирует keyboardLayout для всех узлов проекта
 *
 * @param sheets - Массив листов с узлами
 * @returns Массив листов с обновлённой раскладкой клавиатуры
 */
export function migrateAllKeyboardLayouts(sheets: any[]): any[] {
  // Больше не фильтруем done-button, так как он теперь часть раскладки
  return sheets;
}
