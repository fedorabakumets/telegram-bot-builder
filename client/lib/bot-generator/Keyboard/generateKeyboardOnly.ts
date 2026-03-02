/**
 * @fileoverview Генерация ТОЛЬКО кода клавиатуры (без отправки сообщения)
 *
 * Модуль создаёт Python-код для генерации клавиатуры без отправки сообщения.
 * Используется когда сообщение уже было отправлено отдельно (например, с изображением).
 *
 * @module bot-generator/Keyboard/generateKeyboardOnly
 */

import { Node } from '@shared/schema';
import { generateButtonText } from '../format/generateButtonText';
import { getAdjustCode } from './getAdjustCode';
import { toPythonBoolean } from '../format/toPythonBoolean';

/**
 * Генерирует ТОЛЬКО код клавиатуры (без отправки сообщения)
 *
 * @param node - Узел для генерации клавиатуры
 * @returns Сгенерированный код клавиатуры (только создание, без отправки)
 */
export function generateKeyboardOnly(node: Node): string {
  let code = '';

  // Проверяем наличие кнопок
  const hasButtons = node.data.keyboardType !== 'none' && node.data.buttons && node.data.buttons.length > 0;

  if (!hasButtons) {
    return code; // Нет кнопок - возвращаем пустую строку
  }

  // Генерируем код клавиатуры в зависимости от типа
  if (node.data.keyboardType === 'reply') {
    code += '    # Создаем reply клавиатуру\n';
    code += '    builder = ReplyKeyboardBuilder()\n';

    node.data.buttons.forEach(button => {
      if (button.action === 'contact' && button.requestContact) {
        code += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_contact=True))\n`;
      } else if (button.action === 'location' && button.requestLocation) {
        code += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}, request_location=True))\n`;
      } else {
        code += `    builder.add(KeyboardButton(text=${generateButtonText(button.text)}))\n`;
      }
    });

    code += `    ${getAdjustCode(node.data.buttons, node.data)}\n`;

    const resizeKeyboard = toPythonBoolean(node.data.resizeKeyboard);
    const oneTimeKeyboard = toPythonBoolean(node.data.oneTimeKeyboard);
    code += `    keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;

  } else if (node.data.keyboardType === 'inline') {
    code += '    # Создаем inline клавиатуру\n';
    code += '    builder = InlineKeyboardBuilder()\n';

    node.data.buttons.forEach(button => {
      if (button.action === 'url') {
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, url="${button.url || '#'}"))\n`;
      } else if (button.action === 'goto') {
        const callbackData = button.target || button.id || 'no_action';
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      } else if (button.action === 'command') {
        const commandCallback = `cmd_${button.target ? button.target.replace('/', '') : 'unknown'}`;
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${commandCallback}"))\n`;
      } else {
        // Кнопки по умолчанию
        const callbackData = button.target || button.id || 'no_action';
        code += `    builder.add(InlineKeyboardButton(text=${generateButtonText(button.text)}, callback_data="${callbackData}"))\n`;
      }
    });

    code += `    ${getAdjustCode(node.data.buttons, node.data)}\n`;
    code += '    keyboard = builder.as_markup()\n';
  }

  return code;
}
