/**
 * @fileoverview Ключ сворачивания подкатегории палитры
 * @module components/editor/sidebar/components/palette-collapse-key
 */

/**
 * Строит уникальный ключ подкатегории внутри главной
 * @param mainTitle - Название главной категории
 * @param subTitle - Название подкатегории
 * @returns Ключ для Set свёрнутых категорий
 */
export function paletteSubCollapseKey(mainTitle: string, subTitle: string): string {
  return `${mainTitle}::${subTitle}`;
}
