/**
 * @fileoverview Обертка для генерации reply клавиатуры (совместимость со старым API)
 * @module lib/bot-generator/Keyboard/generateReplyKeyboardCode
 */

import { generateKeyboard } from '../../../templates/keyboard';
import type { NodeData } from '../../transitions/types/button-response-config-types';
import type { Button } from '../../transitions/types/button-response-config-types';

/**
 * Генерация кода reply клавиатуры (старый API для совместимости)
 * @param buttons - Массив кнопок
 * @param indent - Уровень отступа
 * @param nodeId - ID узла
 * @param nodeData - Данные узла
 * @returns Сгенерированный Python код
 */
export function generateReplyKeyboardCode(
  buttons: Button[],
  indent: string,
  nodeId: string,
  nodeData: NodeData
): string {
  return generateKeyboard({
    keyboardType: 'reply',
    buttons,
    nodeId,
    indentLevel: indent,
    resizeKeyboard: nodeData.resizeKeyboard,
    oneTimeKeyboard: nodeData.oneTimeKeyboard,
    keyboardLayout: nodeData.keyboardLayout,
  });
}
