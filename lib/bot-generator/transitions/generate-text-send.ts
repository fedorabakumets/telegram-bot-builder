/**
 * @fileoverview Генерация кода для отправки текстовых сообщений
 * 
 * Модуль создаёт Python-код для отправки текста с клавиатурами
 * (inline или reply) или без них.
 * 
 * @module bot-generator/transitions/generate-text-send
 */

import { generateButtonText, toPythonBoolean } from '../format';
import { generateKeyboard } from '../../templates/keyboard';

/**
 * Генерирует Python-код для отправки текстового сообщения
 * 
 * @param node - Узел сообщения с данными
 * @param allNodeIds - Массив всех ID узлов
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateTextSend(
  node: any,
  allNodeIds: any[],
  indent: string = '                '
): string {
  let code = '';
  
  if (node.data.keyboardType === "inline" && node.data.buttons.length > 0) {
    code += generateKeyboard({
      keyboardType: 'inline',
      buttons: node.data.buttons,
      nodeId: node.id,
      allNodeIds,
      indentLevel: indent,
      keyboardLayout: node.data?.keyboardLayout,
    });
    code += `${indent}await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n`;
  } else if (node.data.keyboardType === "reply" && node.data.buttons.length > 0) {
    code += `${indent}builder = ReplyKeyboardBuilder()\n`;
    node.data.buttons.forEach((button: { text: string; }) => {
      code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
    });
    const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
    const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
    code += `${indent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
    code += `${indent}await message.answer(text, reply_markup=keyboard, parse_mode=parse_mode)\n`;
  } else {
    code += `${indent}await message.answer(text, parse_mode=parse_mode)\n`;
  }
  
  return code;
}
