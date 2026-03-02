/**
 * @fileoverview Утилиты миграции keyboardLayout
 *
 * Фильтрует done-button из рядов клавиатуры.
 */

/**
 * Мигрирует keyboardLayout для всех узлов проекта
 *
 * @param sheets - Массив листов с узлами
 * @returns Массив листов с обновлённой раскладкой клавиатуры
 */
export function migrateAllKeyboardLayouts(sheets: any[]): any[] {
  return sheets.map(sheet => ({
    ...sheet,
    nodes: sheet.nodes?.map((node: any) => {
      let keyboardLayout = node.data?.keyboardLayout;

      if (keyboardLayout) {
        // Фильтруем done-button из рядов
        keyboardLayout = {
          ...keyboardLayout,
          rows: keyboardLayout.rows
            .map((row: any) => ({
              ...row,
              buttonIds: row.buttonIds.filter((id: string) => id !== 'done-button')
            }))
            .filter((row: any) => row.buttonIds.length > 0)
        };

        // НЕ вызываем fixAutoLayout, чтобы не перезаписывать ручные изменения пользователя
        // keyboardLayout = fixAutoLayout(keyboardLayout, buttons.length);
      }

      if (keyboardLayout !== node.data?.keyboardLayout) {
        return {
          ...node,
          data: { ...node.data, keyboardLayout }
        };
      }

      return node;
    }) || []
  }));
}
