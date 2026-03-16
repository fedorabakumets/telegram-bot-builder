/**
 * @fileoverview Обертка для генерации inline клавиатуры (совместимость со старым API)
 * @module lib/bot-generator/Keyboard/generateInlineKeyboardCode
 */

import { generateKeyboard } from '../../../templates/keyboard';
import type { NodeData } from '../../transitions/types/button-response-config-types';
import type { Button } from '../../transitions/types/button-response-config-types';

/**
 * Генерация кода inline клавиатуры (старый API для совместимости)
 * @param buttons - Массив кнопок
 * @param indent - Уровень отступа
 * @param nodeId - ID узла
 * @param nodeData - Данные узла
 * @param allNodeIds - Массив всех ID узлов
 * @returns Сгенерированный Python код
 */
export function generateInlineKeyboardCode(
  buttons: Button[],
  indent: string,
  nodeId: string,
  nodeData: NodeData,
  allNodeIds: string[]
): string {
  return generateKeyboard({
    keyboardType: 'inline',
    buttons,
    nodeId,
    allNodeIds,
    indentLevel: indent,
    allowMultipleSelection: nodeData.allowMultipleSelection,
    multiSelectVariable: nodeData.multiSelectVariable,
    keyboardLayout: nodeData.keyboardLayout,
  });
}
