/**
 * @fileoverview Фильтрация палитры по выключенным типам блоков
 * @module components/editor/sidebar/filter-disabled-categories
 */

import type { PaletteMainCategory } from './constants';

/**
 * Убирает выключенные типы, пустые подкатегории и пустые главные категории
 * @param categories - Главные категории палитры
 * @param disabledTypes - Выключенные типы
 * @returns Отфильтрованные главные категории
 */
export function filterDisabledCategories(
  categories: PaletteMainCategory[],
  disabledTypes: readonly string[] | undefined,
): PaletteMainCategory[] {
  if (!disabledTypes?.length) return categories;
  const disabled = new Set(disabledTypes);
  return categories
    .map((main) => ({
      ...main,
      subcategories: main.subcategories
        .map((sub) => ({
          ...sub,
          components: sub.components.filter((item) => !disabled.has(item.type)),
        }))
        .filter((sub) => sub.components.length > 0),
    }))
    .filter((main) => main.subcategories.length > 0);
}
