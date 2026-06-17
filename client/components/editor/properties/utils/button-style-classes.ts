/**
 * @fileoverview CSS-классы визуального стиля кнопок (Bot API 9.4)
 * @module components/editor/properties/utils/button-style-classes
 */

import type { Button } from '@shared/schema';

/**
 * Возвращает CSS-классы фона и текста кнопки по полю `style`.
 *
 * @param style - Стиль кнопки: primary, success, danger или undefined
 * @returns Строка Tailwind-классов
 */
export function getButtonStyleClassName(style?: Button['style']): string {
  if (style === 'primary') {
    return 'bg-blue-500 dark:bg-blue-600 border-blue-600 dark:border-blue-500 text-white';
  }

  if (style === 'success') {
    return 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-500 text-white';
  }

  if (style === 'danger') {
    return 'bg-red-500 dark:bg-red-600 border-red-600 dark:border-red-500 text-white';
  }

  return 'bg-gradient-to-r from-gray-50 to-slate-50 dark:from-gray-800/50 dark:to-slate-800/50 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300';
}
