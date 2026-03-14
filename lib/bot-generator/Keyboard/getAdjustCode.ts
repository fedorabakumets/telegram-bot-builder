/**
 * @fileoverview Утилита для получения кода builder.adjust()
 *
 * Использует keyboardLayout если есть, иначе calculateOptimalColumns.
 *
 * @module lib/bot-generator/Keyboard/getAdjustCode
 */

import { calculateOptimalColumns } from './calculateOptimalColumns';
import { generateAdjustCode } from './generateKeyboardLayoutCode';

/**
 * Генерирует код builder.adjust() для узла
 *
 * @param buttons - Массив кнопок
 * @param nodeData - Данные узла (включая keyboardLayout)
 * @param indentLevel - Уровень отступа (по умолчанию '')
 * @returns Python-код для adjust()
 */
export function getAdjustCode(
  buttons: any[],
  nodeData: any,
  indentLevel: string = ''
): string {
  // Используем keyboardLayout если есть и не авто
  if (nodeData?.keyboardLayout && !nodeData.keyboardLayout.autoLayout) {
    return indentLevel + generateAdjustCode(nodeData.keyboardLayout, buttons.length).trim();
  }

  // Старая логика с calculateOptimalColumns
  const columns = calculateOptimalColumns(buttons, nodeData);
  return indentLevel + `builder.adjust(${columns})`;
}
