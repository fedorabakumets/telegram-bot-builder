/**
 * @fileoverview Генерация обычной inline клавиатуры
 *
 * Модуль создаёт Python-код для генерации inline клавиатуры
 * для узлов без множественного выбора.
 *
 * @module bot-generator/transitions/keyboard/generate-regular-inline-keyboard
 */

import { Button } from '../../types';
import { generateKeyboard } from '../../../templates/keyboard';

/**
 * Параметры для генерации inline клавиатуры
 */
export interface RegularInlineKeyboardParams {
  buttons: Button[];
  nodeData?: any;
  nodeId?: string;
  keyboardLayout?: string;
}

/**
 * Генерирует Python-код для обычной inline клавиатуры
 *
 * @param params - Параметры клавиатуры
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateRegularInlineKeyboard(
  params: RegularInlineKeyboardParams,
  indent: string = '    '
): string {
  const { buttons, nodeData } = params;

  const keyboardCode = generateKeyboard({
    keyboardType: 'inline',
    buttons: buttons || [],
    nodeId: nodeData?.id || params.nodeId || 'inline',
    indentLevel: indent,
    keyboardLayout: params.keyboardLayout ?? nodeData?.keyboardLayout,
  });

  return keyboardCode;
}
