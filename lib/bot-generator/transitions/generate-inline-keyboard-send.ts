/**
 * @fileoverview Генерация кода для отправки сообщений с inline клавиатурой
 * Делегирует в Jinja2-шаблон templates/keyboard
 * @module bot-generator/transitions/generate-inline-keyboard-send
 */

import { formatTextForPython } from '../../templates/filters/python-formatters';
import { generateKeyboard } from '../../templates/keyboard';

export interface Button {
  /** Текст кнопки. */
  text: string;
  /** Действие кнопки. */
  action?: string;
  /** Идентификатор целевого узла. */
  target?: string;
  /** Адрес ссылки. */
  url?: string;
  /** Идентификатор кнопки. */
  id?: string;
}

/**
 * Формирует отправку сообщения с inline-клавиатурой.
 * @param node - Узел сообщения.
 * @param indent - Отступ Python-кода.
 * @returns Код отправки сообщения.
 */
export function generateInlineKeyboardSend(node: any, indent: string = '                '): string {
  const formattedText = formatTextForPython(node.data.messageText || 'Сообщение');
  let code = `${indent}text = ${formattedText}\n`;
  code += generateKeyboard({
    keyboardType: 'inline',
    buttons: node.data.buttons,
    keyboardLayout: node.data.keyboardLayout,
    enableDynamicButtons: node.data.enableDynamicButtons,
    dynamicButtons: node.data.dynamicButtons,
    allowMultipleSelection: node.data.allowMultipleSelection,
    multiSelectVariable: node.data.multiSelectVariable,
    checkmarkSymbol: node.data.checkmarkSymbol,
    radioSelectedSymbol: node.data.radioSelectedSymbol,
    radioUnselectedSymbol: node.data.radioUnselectedSymbol,
    nodeId: node.id,
    allNodeIds: [],
    resizeKeyboard: node.data.resizeKeyboard,
    oneTimeKeyboard: node.data.oneTimeKeyboard,
    indentLevel: indent,
  });
  code += `${indent}await fake_message.answer(text, reply_markup=keyboard)\n`;
  return code;
}
