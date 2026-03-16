/**
 * @fileoverview Генерация обычной reply клавиатуры
 *
 * Модуль создаёт Python-код для генерации reply клавиатуры
 * для узлов без множественного выбора.
 *
 * @module bot-generator/transitions/keyboard/generate-regular-reply-keyboard
 */

import { Button } from '../../types';
import { generateKeyboard } from '../../../templates/keyboard';

/**
 * Параметры для генерации reply клавиатуры
 */
export interface RegularReplyKeyboardParams {
  buttons: Button[];
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  hasConditionalMessages?: boolean;
  nodeId?: string;
}

/**
 * Генерирует Python-код для обычной reply клавиатуры
 *
 * @param params - Параметры клавиатуры
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateRegularReplyKeyboard(
  params: RegularReplyKeyboardParams,
  indent: string = '    '
): string {
  const { buttons, resizeKeyboard, oneTimeKeyboard, hasConditionalMessages, nodeId } = params;

  let code = '';

  if (hasConditionalMessages) {
    // Проверяем, была ли уже создана условная клавиатура
    code += `${indent}if "conditional_keyboard" not in locals():\n`;
    code += `${indent}    conditional_keyboard = None\n`;
    code += `${indent}# Проверяем, есть ли условная клавиатура\n`;
    code += `${indent}if "conditional_keyboard" in locals() and conditional_keyboard is not None:\n`;
    code += `${indent}    keyboard = conditional_keyboard\n`;
    code += `${indent}    logging.info("✅ Используем условную reply клавиатуру")\n`;
    code += `${indent}else:\n`;
    code += `${indent}    # Условная клавиатура не создана, используем обычную\n`;
    const keyboardCode = generateKeyboard({
      keyboardType: 'reply',
      buttons: buttons || [],
      nodeId: nodeId || 'conditional',
      indentLevel: `${indent}    `,
      resizeKeyboard,
      oneTimeKeyboard,
    });
    code += keyboardCode;
    code += `${indent}    logging.info("✅ Используем обычную reply клавиатуру")\n`;
  } else {
    // Нет условных сообщений, просто создаем обычную клавиатуру
    const keyboardCode = generateKeyboard({
      keyboardType: 'reply',
      buttons: buttons || [],
      nodeId: nodeId || 'regular',
      indentLevel: indent,
      resizeKeyboard,
      oneTimeKeyboard,
    });
    code += keyboardCode;
  }

  return code;
}
