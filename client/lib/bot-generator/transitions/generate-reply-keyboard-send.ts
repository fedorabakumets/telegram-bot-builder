/**
 * @fileoverview Генерация кода для отправки сообщений с reply клавиатурой
 * 
 * Модуль создаёт Python-код для отправки сообщений с reply кнопками.
 * Поддерживает кнопки contact, location и обычные текстовые кнопки.
 * 
 * @module bot-generator/transitions/generate-reply-keyboard-send
 */

import { Button } from '../../types';
import { generateButtonText, toPythonBoolean } from '../../format';

/**
 * Генерирует Python-код для отправки сообщения с reply клавиатурой
 * 
 * @param node - Узел сообщения с данными кнопок
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateReplyKeyboardSend(
  node: any,
  indent: string = '                '
): string {
  let code = '';
  const messageText = node.data.messageText || 'Сообщение';
  
  code += `${indent}text = "${messageText}"\n`;
  code += `${indent}builder = ReplyKeyboardBuilder()\n`;
  
  node.data.buttons.forEach((button: Button) => {
    if (button.action === "contact" && button.requestContact) {
      code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
    } else if (button.action === "location" && button.requestLocation) {
      code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
    } else {
      code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
    }
  });
  
  const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
  const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
  code += `${indent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
  code += `${indent}await fake_message.answer(text, reply_markup=keyboard)\n`;
  
  return code;
}
