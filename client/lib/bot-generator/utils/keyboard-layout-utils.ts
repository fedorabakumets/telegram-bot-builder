/**
 * @fileoverview Утилита для проверки горячих клавиш с поддержкой русской/английской раскладки
 *
 * @module keyboard-layout-utils
 */

/**
 * Проверяет, соответствует ли нажатая клавиша ожидаемой (с учётом раскладки)
 * @param key - Нажатая клавиша (e.key)
 * @param expected - Ожидаемая клавиша (английская)
 * @param expectedRu - Ожидаемая клавиша (русская)
 */
export function isKeyboardKey(key: string, expected: string, expectedRu: string): boolean {
  return key === expected || key === expected.toUpperCase() || 
         key === expectedRu || key === expectedRu.toUpperCase();
}
