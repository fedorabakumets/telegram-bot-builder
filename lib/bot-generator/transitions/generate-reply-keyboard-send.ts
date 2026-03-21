/**
 * @fileoverview Генерация кода для отправки сообщений с reply клавиатурой
 * Делегирует в Jinja2-шаблон templates/keyboard
 * @module bot-generator/transitions/generate-reply-keyboard-send
 */

import { formatTextForPython } from '../format';
import { generateKeyboard } from '../../templates/keyboard';

export interface Button {
  text: string;
  action?: string;
  requestContact?: boolean;
  requestLocation?: boolean;
}

export function generateReplyKeyboardSend(node: any, indent: string = '                '): string {
  const formattedText = formatTextForPython(node.data.messageText || 'Сообщение');
  let code = `${indent}text = ${formattedText}\n`;
  code += generateKeyboard({
    keyboardType: 'reply',
    buttons: node.data.buttons,
    nodeId: node.id,
    allNodeIds: [],
    resizeKeyboard: node.data.resizeKeyboard,
    oneTimeKeyboard: node.data.oneTimeKeyboard,
    indentLevel: indent,
  });
  code += `${indent}await fake_message.answer(text, reply_markup=keyboard)\n`;
  return code;
}
