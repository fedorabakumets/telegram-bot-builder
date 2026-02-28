/**
 * @fileoverview Генерация кода для отправки сообщений с inline клавиатурой
 *
 * Модуль создаёт Python-код для отправки сообщений с inline кнопками
 * через aiogram. Поддерживает кнопки URL, goto и command.
 *
 * @module bot-generator/transitions/generate-inline-keyboard-send
 */

import { generateButtonText } from '../format';

/**
 * Тип кнопки inline клавиатуры
 */
export interface Button {
  text: string;
  action?: string;
  target?: string;
  url?: string;
  id?: string;
}

/**
 * Генерирует Python-код для отправки сообщения с inline клавиатурой
 *
 * @param node - Узел сообщения с данными кнопок
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateInlineKeyboardSend(
  node: any,
  indent: string = '                '
): string {
  let code = '';
  const messageText = node.data.messageText || 'Сообщение';
  
  code += `${indent}text = "${messageText}"\n`;
  code += `${indent}builder = InlineKeyboardBuilder()\n`;
  
  node.data.buttons.forEach((button: Button) => {
    if (button.action === "url") {
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
    } else if (button.action === 'goto') {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
    } else if (button.action === 'command') {
      const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
    } else {
      const callbackData = button.target || button.id || 'no_action';
      code += `${indent}builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
    }
  });
  
  code += `${indent}keyboard = builder.as_markup()\n`;
  code += `${indent}await fake_message.answer(text, reply_markup=keyboard)\n`;
  
  return code;
}
