/**
 * @fileoverview Фильтрация палитры по выключенным типам блоков
 * @module components/editor/sidebar/filter-disabled-categories
 */

import type { ComponentDefinition } from '@shared/schema';

/** Категория палитры */
export type PaletteCategory = {
  /** Название категории */
  title: string;
  /** Компоненты в категории */
  components: ComponentDefinition[];
};

/**
 * Убирает выключенные типы и пустые категории
 * @param categories - Исходные категории палитры
 * @param disabledTypes - Выключенные типы
 * @returns Отфильтрованные категории
 */
export function filterDisabledCategories(
  categories: PaletteCategory[],
  disabledTypes: readonly string[] | undefined,
): PaletteCategory[] {
  if (!disabledTypes?.length) return categories;
  const disabled = new Set(disabledTypes);
  return categories
    .map((category) => ({
      ...category,
      components: category.components.filter((item) => !disabled.has(item.type)),
    }))
    .filter((category) => category.components.length > 0);
}
