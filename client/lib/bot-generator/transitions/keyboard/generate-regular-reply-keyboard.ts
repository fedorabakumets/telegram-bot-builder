/**
 * @fileoverview Генерация обычной reply клавиатуры
 * 
 * Модуль создаёт Python-код для генерации reply клавиатуры
 * для узлов без множественного выбора.
 * 
 * @module bot-generator/transitions/keyboard/generate-regular-reply-keyboard
 */

import { Button } from '../../types';
import { generateButtonText, toPythonBoolean } from '../../format';
import { calculateOptimalColumns } from '../../Keyboard';

/**
 * Параметры для генерации reply клавиатуры
 */
export interface RegularReplyKeyboardParams {
  buttons: Button[];
  resizeKeyboard?: boolean;
  oneTimeKeyboard?: boolean;
  hasConditionalMessages?: boolean;
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
  const { buttons, resizeKeyboard, oneTimeKeyboard, hasConditionalMessages } = params;
  
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
    code += `${indent}    builder = ReplyKeyboardBuilder()\n`;
    buttons.forEach((btn: Button) => {
      if (btn.action === "contact" && btn.requestContact) {
        code += `${indent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
      } else if (btn.action === "location" && btn.requestLocation) {
        code += `${indent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
      } else {
        code += `${indent}    builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
      }
    });
    const columns = calculateOptimalColumns(buttons, { resizeKeyboard, oneTimeKeyboard });
    code += `${indent}    builder.adjust(${columns})\n`;
    const resize = toPythonBoolean(resizeKeyboard);
    const oneTime = toPythonBoolean(oneTimeKeyboard);
    code += `${indent}    keyboard = builder.as_markup(resize_keyboard=${resize}, one_time_keyboard=${oneTime})\n`;
    code += `${indent}    logging.info("✅ Используем обычную reply клавиатуру")\n`;
  } else {
    // Нет условных сообщений, просто создаем обычную клавиатуру
    code += `${indent}builder = ReplyKeyboardBuilder()\n`;
    buttons.forEach((btn: Button) => {
      if (btn.action === "contact" && btn.requestContact) {
        code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
      } else if (btn.action === "location" && btn.requestLocation) {
        code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
      } else {
        code += `${indent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
      }
    });
    const columns = calculateOptimalColumns(buttons, { resizeKeyboard, oneTimeKeyboard });
    code += `${indent}builder.adjust(${columns})\n`;
    const resize = toPythonBoolean(resizeKeyboard);
    const oneTime = toPythonBoolean(oneTimeKeyboard);
    code += `${indent}keyboard = builder.as_markup(resize_keyboard=${resize}, one_time_keyboard=${oneTime})\n`;
  }
  
  return code;
}
