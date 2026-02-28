/**
 * @fileoverview Обработка сбора пользовательского ввода
 *
 * Генерирует Python-код для настройки ожидания ввода от пользователя
 * (текст, фото, видео, аудио, документ) вместе с клавиатурами.
 *
 * @module handle-input-collection
 */

import type { Node } from '@shared/schema';
import type { Button } from '../../bot-generator';
import { formatTextForPython, generateButtonText } from '../format';
import { calculateOptimalColumns } from '../Keyboard';
import { generateWaitingStateCode } from '../format';
import { toPythonBoolean } from '../format';

/**
 * Генерирует код для сбора ввода от пользователя
 * @param targetNode - Узел с настройками сбора ввода
 * @param bodyIndent - Отступ для тела блока кода
 * @param allNodeIds - Массив всех ID узлов для валидации
 * @returns Строка с Python-кодом для сбора ввода
 */
export function handleInputCollection(
  targetNode: Node,
  bodyIndent: string,
  allNodeIds: string[]
): string {
  let code = '';

  const inputVariable = targetNode.data?.inputVariable || `response_${targetNode.id}`;

  // Установка состояния ожидания ввода
  code += `${bodyIndent}# Устанавливаем состояние ожидания ввода для узла ${targetNode.id}\n`;
  code += generateWaitingStateCode(targetNode, bodyIndent);
  code += `${bodyIndent}logging.info(f"✅ Узел ${targetNode.id} настроен для сбора ввода (collectUserInput=true)")\n`;

  // Обработка inline клавиатуры с вводом
  if (targetNode.data?.keyboardType === 'inline' && targetNode.data?.buttons?.length) {
    code += generateInlineKeyboardWithInput(targetNode, bodyIndent, allNodeIds);
  } else if (targetNode.data?.keyboardType === 'reply' && targetNode.data?.buttons?.length) {
    code += generateReplyKeyboardWithInput(targetNode, bodyIndent);
  }

  return code;
}

/**
 * Генерирует inline клавиатуру с ожиданием ввода
 */
function generateInlineKeyboardWithInput(
  targetNode: Node,
  bodyIndent: string,
  allNodeIds: string[]
): string {
  let code = '';

  code += `${bodyIndent}# Показываем inline кнопки вместе с ожиданием ввода\n`;
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
  code += `${bodyIndent}logging.info(f"✅ Показаны inline кнопки для узла ${targetNode.id} с collectUserInput")\n`;

  return code;
}

/**
 * Генерирует reply клавиатуру с ожиданием ввода
 */
function generateReplyKeyboardWithInput(
  targetNode: Node,
  bodyIndent: string
): string {
  let code = '';

  code += `${bodyIndent}# Показываем reply клавиатуру вместе с ожиданием ввода\n`;
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
  code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars)\n`;
  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;

  return code;
}
