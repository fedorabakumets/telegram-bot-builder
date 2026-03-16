/**
 * @fileoverview Генерация клавиатур для навигации
 *
 * Содержит функции для генерации inline и reply клавиатур
 * при навигации по узлам без сбора ввода.
 *
 * @module handle-keyboard-navigation
 */

import type { Node } from '@shared/schema';
import type { Button } from '../types/button-types';
import { generateButtonText } from '../format';
import { toPythonBoolean } from '../format';
import { generateNavigateToNodeWithText } from '../transitions/generate-node-navigation';
import { generateKeyboard } from '../../templates/keyboard';

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
  return generateNoKeyboard(bodyIndent, allUserVars);
}

/**
 * Генерирует inline клавиатуру для узла
 */
function generateInlineKeyboard(targetNode: Node, bodyIndent: string): string {
  let code = '';

  code += `${bodyIndent}# Создаем inline клавиатуру\n`;
  const keyboardCode = generateKeyboard({
    keyboardType: 'inline',
    buttons: targetNode.data.buttons || [],
    nodeId: targetNode.id,
    indentLevel: bodyIndent,
  });
  code += keyboardCode;

  // Используем переиспользуемую функцию навигации с клавиатурой
  code += `${bodyIndent}# Навигация к узлу с отправкой сообщения и inline клавиатурой\n`;
  code += `${bodyIndent}await navigate_to_node(message, current_node_id, text=text, reply_markup=keyboard)\n`;

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
  const keyboardCode = generateKeyboard({
    keyboardType: 'reply',
    buttons: targetNode.data.buttons || [],
    nodeId: targetNode.id,
    indentLevel: bodyIndent,
    resizeKeyboard: targetNode.data?.resizeKeyboard !== false,
    oneTimeKeyboard: targetNode.data?.oneTimeKeyboard === true,
  });
  code += keyboardCode;

  // Используем переиспользуемую функцию навигации с клавиатурой
  code += `${bodyIndent}# Навигация к узлу с отправкой сообщения и клавиатурой\n`;
  code += `${bodyIndent}await navigate_to_node(message, current_node_id, text=text, reply_markup=keyboard)\n`;

  return code;
}

/**
 * Генерирует код для сообщения без клавиатуры
 */
function generateNoKeyboard(
  bodyIndent: string,
  allUserVars: string
): string {
  let code = '';

  // Используем переиспользуемую функцию навигации
  code += `${bodyIndent}# Навигация к узлу с отправкой сообщения\n`;
  code += `${bodyIndent}await navigate_to_node(message, current_node_id, text=text)\n`;

  return code;
}
