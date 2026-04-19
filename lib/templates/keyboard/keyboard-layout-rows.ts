/**
 * @fileoverview Хелперы для разбиения кнопок по строкам keyboardLayout
 * @module templates/keyboard/keyboard-layout-rows
 */

/** Специальный ID виртуального ряда динамических кнопок */
const DYNAMIC_PLACEHOLDER = '__dynamic__';

/**
 * Нормализует идентификаторы кнопок строки раскладки к массиву.
 * @param buttonIds - Один ID, массив ID или произвольное значение
 * @returns Массив идентификаторов кнопок
 */
function normalizeRowButtonIds(buttonIds: unknown): string[] {
  if (Array.isArray(buttonIds)) {
    return buttonIds.filter((buttonId): buttonId is string => typeof buttonId === 'string');
  }
  return typeof buttonIds === 'string' && buttonIds.trim() ? [buttonIds] : [];
}

/** Строки статических кнопок до и после блока динамических кнопок */
export interface StaticRowsAroundDynamic {
  /** Статические строки до виртуального ряда __dynamic__ */
  staticRowsBefore: any[][];
  /** Статические строки после виртуального ряда __dynamic__ */
  staticRowsAfter: any[][];
}

/**
 * Разбивает массив кнопок на строки вокруг виртуального ряда __dynamic__.
 * @param buttons - Статические кнопки клавиатуры
 * @param keyboardLayout - Раскладка клавиатуры
 * @returns Строки кнопок до и после динамического блока
 */
export function buildStaticRowsAroundDynamic(
  buttons: any[],
  keyboardLayout?: any
): StaticRowsAroundDynamic {
  if (!keyboardLayout?.rows?.length) {
    return { staticRowsBefore: [], staticRowsAfter: [] };
  }

  const dynamicRowIndex = keyboardLayout.rows.findIndex(
    (row: any) => normalizeRowButtonIds(row.buttonIds).includes(DYNAMIC_PLACEHOLDER)
  );
  if (dynamicRowIndex === -1) {
    return { staticRowsBefore: [], staticRowsAfter: [] };
  }

  const buttonMap = new Map(buttons.map((button: any) => [button.id, button]));
  const mentionedIds = new Set<string>();
  const staticRowsBefore: any[][] = [];
  const staticRowsAfter: any[][] = [];

  for (let index = 0; index < keyboardLayout.rows.length; index += 1) {
    const row = keyboardLayout.rows[index];
    const rowButtonIds = normalizeRowButtonIds(row.buttonIds);
    if (rowButtonIds.length === 0 || index === dynamicRowIndex) {
      continue;
    }

    const rowButtons = rowButtonIds
      .filter((buttonId: string) => buttonId !== DYNAMIC_PLACEHOLDER)
      .map((buttonId: string) => {
        mentionedIds.add(buttonId);
        return buttonMap.get(buttonId);
      })
      .filter(Boolean);

    if (rowButtons.length === 0) {
      continue;
    }

    if (index < dynamicRowIndex) {
      staticRowsBefore.push(rowButtons);
    } else {
      staticRowsAfter.push(rowButtons);
    }
  }

  const leftoverButtons = buttons.filter((button: any) => !mentionedIds.has(button.id));
  if (leftoverButtons.length > 0) {
    staticRowsAfter.push(leftoverButtons);
  }

  return { staticRowsBefore, staticRowsAfter };
}
