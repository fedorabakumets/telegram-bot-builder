/**
 * @fileoverview Генерация клавиатур для навигации
 *
 * Содержит функции для генерации inline и reply клавиатур
 * при навигации по узлам без сбора ввода.
 *
 * @module handle-keyboard-navigation
 */

import type { Node } from '@shared/schema';
import type { Button } from '../bot-generator';
import { formatTextForPython, generateButtonText } from '../bot-generator/format';
import { calculateOptimalColumns } from '../bot-generator/Keyboard';
import { toPythonBoolean } from '../bot-generator/format';

/**
 * Генерирует код для обработки навигации с клавиатурами
 * @param targetNode - Узел с настройками клавиатуры
 * @param bodyIndent - Отступ для тела блока кода
 * @param allUserVars - Переменная с данными пользователя
 * @returns Строка с Python-кодом для клавиатур
 */
export function handleKeyboardNavigation(
  targetNode: Node,
  bodyIndent: string,
  allUserVars: string
): string {
  if (targetNode.data?.keyboardType === 'inline' && targetNode.data?.buttons?.length) {
    return generateInlineKeyboard(targetNode, bodyIndent);
  }
  if (targetNode.data?.keyboardType === 'reply' && targetNode.data?.buttons?.length) {
    return generateReplyKeyboard(targetNode, bodyIndent, allUserVars);
  }
  return generateNoKeyboard(targetNode, bodyIndent, allUserVars);
}

/**
 * Генерирует inline клавиатуру для узла
 */
function generateInlineKeyboard(targetNode: Node, bodyIndent: string): string {
  let code = '';

  code += `${bodyIndent}# Создаем inline клавиатуру\n`;
  code += `${bodyIndent}builder = InlineKeyboardBuilder()\n`;

  targetNode.data.buttons.forEach((btn: Button) => {
    if (btn.action === 'goto' && btn.target) {
      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${btn.target}"))\n`;
    } else if (btn.action === 'url' && btn.url) {
      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, url="${btn.url}"))\n`;
    } else if (btn.action === 'command' && btn.target) {
      const commandCallback = `cmd_${btn.target.replace('/', '')}`;
      code += `${bodyIndent}builder.add(InlineKeyboardButton(text=${generateButtonText(btn.text)}, callback_data="${commandCallback}"))\n`;
    }
  });

  const columns = calculateOptimalColumns(targetNode.data.buttons, targetNode.data);
  code += `${bodyIndent}builder.adjust(${columns})\n`;
  code += `${bodyIndent}keyboard = builder.as_markup()\n`;
  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;

  return code;
}

/**
 * Генерирует reply клавиатуру для узла
 */
function generateReplyKeyboard(
  targetNode: Node,
  bodyIndent: string,
  allUserVars: string
): string {
  let code = '';

  code += `${bodyIndent}# Создаем reply клавиатуру\n`;
  code += `${bodyIndent}builder = ReplyKeyboardBuilder()\n`;

  targetNode.data.buttons.forEach((btn: Button) => {
    if (btn.action === 'contact' && btn.requestContact) {
      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_contact=True))\n`;
    } else if (btn.action === 'location' && btn.requestLocation) {
      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}, request_location=True))\n`;
    } else {
      code += `${bodyIndent}builder.add(KeyboardButton(text=${generateButtonText(btn.text)}))\n`;
    }
  });

  const resizeKeyboard = toPythonBoolean(targetNode.data?.resizeKeyboard);
  const oneTimeKeyboard = toPythonBoolean(targetNode.data?.oneTimeKeyboard);
  code += `${bodyIndent}keyboard = builder.as_markup(resize_keyboard=${resizeKeyboard}, one_time_keyboard=${oneTimeKeyboard})\n`;
  code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
  code += `${bodyIndent}text = replace_variables_in_text(text, ${allUserVars})\n`;
  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;

  return code;
}

/**
 * Генерирует код для сообщения без клавиатуры
 */
function generateNoKeyboard(
  targetNode: Node,
  bodyIndent: string,
  allUserVars: string
): string {
  let code = '';

  code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
  code += `${bodyIndent}text = replace_variables_in_text(text, ${allUserVars})\n`;
  code += `${bodyIndent}await message.answer(text)\n`;

  return code;
}
