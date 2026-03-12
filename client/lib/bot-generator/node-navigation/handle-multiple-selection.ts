/**
 * @fileoverview Обработка узлов с множественным выбором
 *
 * Генерирует Python-код для навигации к узлам, где пользователь
 * может выбрать несколько вариантов ответа (multi-select).
 *
 * @module handle-multiple-selection
 */

import type { Node } from '@shared/schema';
import { formatTextForPython } from '../format';
import { generateInlineKeyboardCode } from '../Keyboard';
import { generateUniversalVariableReplacement } from '../database';

/**
 * Генерирует код для обработки узла с множественным выбором
 * @param targetNode - Узел с настройками множественного выбора
 * @param bodyIndent - Отступ для тела блока кода
 * @param allNodeIds - Массив всех ID узлов для валидации
 * @returns Строка с Python-кодом для обработки множественного выбора
 *
 * @example
 * const code = handleMultipleSelectionNode(node, '    ', ['node1', 'node2']);
 */
export function handleMultipleSelectionNode(
  targetNode: Node,
  bodyIndent: string,
  allNodeIds: string[]
): string {
  let code = '';

  const messageText = targetNode.data?.messageText || 'Сообщение';
  const formattedText = formatTextForPython(messageText);

  code += `${bodyIndent}# Прямая навигация к узлу с множественным выбором ${targetNode.id}\n`;
  code += `${bodyIndent}logging.info(f"🔧 Переходим к узлу с множественным выбором: ${targetNode.id}")\n`;
  code += `${bodyIndent}text = ${formattedText}\n`;

  // Замена переменных (передаём targetNode для извлечения usedVariables)
  code += `${bodyIndent}user_data[user_id] = user_data.get(user_id, {})\n`;
  const universalVarCodeLines: string[] = [];
  generateUniversalVariableReplacement(universalVarCodeLines, { node: targetNode, indentLevel: bodyIndent });
  code += universalVarCodeLines.join('\n');

  // Инициализация состояния множественного выбора
  code += `${bodyIndent}# Инициализируем состояние множественного выбора\n`;
  code += `${bodyIndent}user_data[user_id]["multi_select_${targetNode.id}"] = []\n`;
  code += `${bodyIndent}user_data[user_id]["multi_select_node"] = "${targetNode.id}"\n`;
  code += `${bodyIndent}user_data[user_id]["multi_select_type"] = "selection"\n`;

  if (targetNode.data?.multiSelectVariable) {
    code += `${bodyIndent}user_data[user_id]["multi_select_variable"] = "${targetNode.data.multiSelectVariable}"\n`;
  }

  // Создание inline клавиатуры с кнопками выбора
  if (targetNode.data?.buttons && targetNode.data.buttons.length > 0) {
    code += generateInlineKeyboardCode(
      targetNode.data.buttons,
      bodyIndent,
      targetNode.id,
      targetNode.data,
      allNodeIds
    );
    code += `${bodyIndent}await message.answer(text, reply_markup=keyboard)\n`;
  } else {
    code += `${bodyIndent}await message.answer(text)\n`;
  }

  code += `${bodyIndent}logging.info(f"✅ Прямая навигация к узлу множественного выбора ${targetNode.id} выполнена")\n`;

  return code;
}
