/**
 * @fileoverview Главная функция навигации по узлам
 *
 * Координирует обработку всех узлов графа бота, делегируя
 * специализированным функциям обработку различных типов узлов.
 *
 * @module handle-node-navigation
 */

import type { Node } from '@shared/schema';
import { getNodeCondition, generateNoNodesWarning, type NavigationContext } from './utils/navigation-helpers';
import { handleMultipleSelectionNode } from './handle-multiple-selection';
import { handleInputCollection } from './handle-input-collection';
import { handleConditionalMessages } from './handle-conditional-messages';
import { handleKeyboardNavigation } from './handle-keyboard-navigation';
import { handleAutoTransition, canAutoTransition } from './handle-auto-transition';
import { handleCommandNode } from './handle-command-node';

// Импорт для форматирования
import { formatTextForPython } from '../format';

/**
 * Соединение между узлами графа
 */
export interface Connection {
  /** Уникальный идентификатор соединения */
  id: string;
  /** ID исходного узла */
  source: string;
  /** ID целевого узла */
  target: string;
}

/**
 * Генерирует код для навигации по узлам графа бота
 * @param nodes - Массив узлов для навигации
 * @param conditionIndent - Отступ для условий (if/elif)
 * @param bodyIndent - Отступ для тела блока
 * @param allNodeIds - Массив всех ID узлов
 * @param connections - Массив соединений между узлами
 * @returns Строка с Python-кодом навигации
 */
export function handleNodeNavigation(
  nodes: Node[],
  conditionIndent: string,
  bodyIndent: string,
  allNodeIds: string[],
  connections: Connection[]
): string {
  let code = '';

  if (nodes.length === 0) {
    return generateNoNodesWarning(bodyIndent);
  }

  nodes.forEach((targetNode, index) => {
    const condition = getNodeCondition(index);
    code += `${conditionIndent}${condition} current_node_id == "${targetNode.id}":\n`;

    code += generateNodeHandler(targetNode, {
      conditionIndent,
      bodyIndent,
      allNodeIds,
      connections
    });
  });

  return code;
}

/**
 * Генерирует обработчик для одного узла
 */
function generateNodeHandler(
  node: Node,
  context: NavigationContext
): string {
  const { bodyIndent, allNodeIds } = context;

  if (node.type === 'message') {
    return handleMessageNode(node, bodyIndent, allNodeIds);
  }

  if (node.type === 'command') {
    return handleCommandNode(node, bodyIndent);
  }

  // Узел start обрабатывается как message
  if (node.type === 'start') {
    return handleMessageNode(node, bodyIndent, allNodeIds);
  }

  // Узел рассылки не требует генерации текста сообщения
  if (node.type === 'broadcast') {
    return `${bodyIndent}# Узел рассылки - обработка выполняется в handle_broadcast_${node.id.replace(/[^a-zA-Z0-9_]/g, '_')}\n${bodyIndent}pass\n`;
  }

  return generateUnknownNodeHandler(node, bodyIndent);
}

/**
 * Обрабатывает узел сообщения
 */
function handleMessageNode(
  node: Node,
  bodyIndent: string,
  allNodeIds: string[]
): string {
  let code = '';

  // Множественный выбор
  if (node.data?.allowMultipleSelection === true) {
    return handleMultipleSelectionNode(node, bodyIndent, allNodeIds);
  }

  // Сбор ввода
  if (node.data?.collectUserInput === true) {
    return handleInputCollection(node, bodyIndent);
  }

  // Условные сообщения
  if (node.data?.enableConditionalMessages) {
    return handleConditionalMessages(node, bodyIndent);
  }

  // Стандартная навигация с клавиатурами
  code += generateMessageText(node, bodyIndent);
  code += handleKeyboardNavigation(node, bodyIndent, 'all_user_vars');

  // Автопереход
  if (canAutoTransition(node)) {
    code += handleAutoTransition(node, bodyIndent);
  } else {
    code += `${bodyIndent}break  # Нет автоперехода\n`;
  }

  return code;
}

/**
 * Генерирует код текста сообщения
 */
function generateMessageText(node: Node, bodyIndent: string): string {
  let code = '';
  const messageText = node.data?.messageText || 'Сообщение';
  const formattedText = formatTextForPython(messageText);

  code += `${bodyIndent}text = ${formattedText}\n`;
  code += `${bodyIndent}user_data[user_id] = user_data.get(user_id, {})\n`;
  
  // Сохраняем фильтры переменных из узла для replace_variables_in_text
  if (node.data?.variableFilters && Object.keys(node.data.variableFilters).length > 0) {
    code += `${bodyIndent}user_data[user_id]["_variable_filters"] = ${JSON.stringify(node.data.variableFilters)}\n`;
  }

  return code;
}

/**
 * Обработчик для неизвестного типа узла
 */
function generateUnknownNodeHandler(node: Node, bodyIndent: string): string {
  let code = '';
  code += `${bodyIndent}logging.info(f"Переход к узлу ${node.id} типа ${node.type}")\n`;
  code += `${bodyIndent}break  # Выходим из цикла для неизвестного типа узла\n`;
  return code;
}
