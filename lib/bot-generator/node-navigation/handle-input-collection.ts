/**
 * @fileoverview Обработка сбора пользовательского ввода
 *
 * Генерирует Python-код для настройки ожидания ввода от пользователя
 * (текст, фото, видео, аудио, документ) вместе с клавиатурами.
 *
 * @module handle-input-collection
 */

import type { Node } from '@shared/schema';
import type { Button } from '../types/button-types';
import { formatTextForPython, generateButtonText, toPythonBoolean } from '../format';
import { generateUserInputFromNode } from '../../templates/user-input';
import { generateKeyboard } from '../../templates/keyboard';

/**
 * Генерирует код для сбора ввода от пользователя
 * @param targetNode - Узел с настройками сбора ввода
 * @param bodyIndent - Отступ для тела блока кода
 * @returns Строка с Python-кодом для сбора ввода
 */
export function handleInputCollection(
  targetNode: Node,
  bodyIndent: string
): string {
  let code = '';

  // Сначала отправляем сообщение с текстом узла
  const messageText = targetNode.data?.messageText || 'Введите данные';
  const formattedText = formatTextForPython(messageText);
  code += `${bodyIndent}text = ${formattedText}\n`;
  code += `${bodyIndent}# Заменяем переменные в тексте\n`;
  code += `${bodyIndent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
  code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars, variable_filters)\n`;
  code += `${bodyIndent}await message.answer(text)\n`;
  code += `${bodyIndent}logging.info(f"✅ Отправлено сообщение узла ${targetNode.id} с collectUserInput")\n`;
  code += '\n';

  // Установка состояния ожидания ввода
  code += `${bodyIndent}# Устанавливаем состояние ожидания ввода для узла ${targetNode.id}\n`;
  code += generateUserInputFromNode(targetNode, bodyIndent);
  code += `${bodyIndent}logging.info(f"✅ Узел ${targetNode.id} настроен для сбора ввода (collectUserInput=true)")\n`;

  // Обработка inline клавиатуры с вводом
  if (targetNode.data?.keyboardType === 'inline' && targetNode.data?.buttons?.length) {
    code += generateInlineKeyboardWithInput(targetNode, bodyIndent);
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
  bodyIndent: string
): string {
  let code = '';

  code += `${bodyIndent}# Показываем inline кнопки вместе с ожиданием ввода\n`;
  const keyboardCode = generateKeyboard({
    keyboardType: 'inline',
    buttons: targetNode.data.buttons || [],
    nodeId: targetNode.id,
    keyboardLayout: targetNode.data?.keyboardLayout,
    indentLevel: bodyIndent,
  });
  code += keyboardCode;
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
  const keyboardCode = generateKeyboard({
    keyboardType: 'reply',
    buttons: targetNode.data.buttons || [],
    nodeId: targetNode.id,
    keyboardLayout: targetNode.data?.keyboardLayout,
    indentLevel: bodyIndent,
    resizeKeyboard: targetNode.data?.resizeKeyboard !== false,
    oneTimeKeyboard: targetNode.data?.oneTimeKeyboard === true,
  });
  code += keyboardCode;
  code += `${bodyIndent}# Заменяем все переменные в тексте\n`;
  code += `${bodyIndent}# Получаем фильтры переменных для замены\n`;
  code += `${bodyIndent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
  code += `${bodyIndent}text = replace_variables_in_text(text, all_user_vars, variable_filters)\n`;
  code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;

  return code;
}
