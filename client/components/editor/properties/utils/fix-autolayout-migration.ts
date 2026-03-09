/**
 * @fileoverview Миграция для исправления autoLayout в keyboardLayout
 *
 * Автоматически устанавливает autoLayout: false для раскладок
 * которые были созданы вручную (не соответствуют автоматическому распределению).
 *
 * @module components/editor/properties/utils/fix-autolayout-migration
 */

import { KeyboardLayout } from '../types/keyboard-layout';

/**
 * Проверяет соответствует ли keyboardLayout автоматической раскладке
 *
 * @param layout - Раскладка для проверки
 * @param totalButtons - Общее количество кнопок
 * @returns true если раскладка соответствует автоматической
 */
function isAutoLayout(layout: KeyboardLayout, totalButtons: number): boolean {
  if (!layout.rows.length || totalButtons === 0) {
    return true;
  }

  const columns = layout.columns;
  const expectedRows = Math.ceil(totalButtons / columns);

  // Проверяем количество рядов
  if (layout.rows.length !== expectedRows) {
    return false;
  }

  // Проверяем что все ряды кроме последнего заполнены полностью
  for (let i = 0; i < layout.rows.length - 1; i++) {
    if (layout.rows[i].buttonIds.length !== columns) {
      return false;
    }
  }

  // Последний ряд может быть неполным
  const lastRowSize = totalButtons % columns;
  const expectedLastRowSize = lastRowSize === 0 ? columns : lastRowSize;

  if (layout.rows[layout.rows.length - 1].buttonIds.length !== expectedLastRowSize) {
    return false;
  }

  return true;
}

/**
 * Миграция для исправления autoLayout в keyboardLayout
 *
 * @param layout - Раскладка для миграции
 * @param totalButtons - Общее количество кнопок
 * @returns Исправленная раскладка
 *
 * @example
 * const fixed = fixAutoLayout(keyboardLayout, buttons.length);
 */
export function fixAutoLayout(
  layout: KeyboardLayout | undefined,
  totalButtons: number
): KeyboardLayout | undefined {
  if (!layout || !layout.rows.length) {
    return layout;
  }

  // Проверяем соответствует ли раскладка автоматической
  const isAuto = isAutoLayout(layout, totalButtons);

  // Если autoLayout не соответствует фактической раскладке, исправляем
  if (layout.autoLayout !== isAuto) {
    return {
      ...layout,
      autoLayout: isAuto
    };
  }

  return layout;
}

/**
 * Миграция для исправления autoLayout во всех узлах проекта
 *
 * @param sheets - Листы проекта с узлами
 * @returns Листы с исправленной keyboardLayout
 */
export function fixAutoLayoutInSheets(sheets: any[]): any[] {
  return sheets.map(sheet => ({
    ...sheet,
    nodes: sheet.nodes?.map((node: any) => {
      const buttons = node.data?.buttons || [];
      const keyboardLayout = fixAutoLayout(node.data?.keyboardLayout, buttons.length);

      if (keyboardLayout !== node.data?.keyboardLayout) {
        return {
          ...node,
          data: {
            ...node.data,
            keyboardLayout
          }
        };
      }

      return node;
    }) || []
  }));
}
