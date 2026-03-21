/**
 * @fileoverview Генерация кода для отправки сообщений с inline клавиатурой
 * Делегирует в Jinja2-шаблон templates/keyboard
 * @module bot-generator/transitions/generate-inline-keyboard-send
 */

import { formatTextForPython } from '../format';
import { generateKeyboard } from '../../templates/keyboard';

export interface Button {
  text: string;
  action?: string;
  target?: string;
  url?: string;
  id?: string;
}

export function generateInlineKeyboardSend(node: any, indent: string = '                '): string {
  const formattedText = formatTextForPython(node.data.messageText || 'Сообщение');
  let code = `${indent}text = ${formattedText}\n`;
  code += generateKeyboard({
    keyboardType: 'inline',
    buttons: node.data.buttons,
    nodeId: node.id,
    allNodeIds: [],
    indentLevel: indent,
  });
  code += `${indent}await fake_message.answer(text, reply_markup=keyboard)\n`;
  return code;
}
