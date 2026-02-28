/**
 * @fileoverview Генерация проверки автоперехода
 * 
 * Модуль создаёт Python-код для проверки и генерации
 * кода автоперехода между узлами.
 * 
 * @module bot-generator/transitions/auto-transition/generate-auto-transition-check
 */

import { toPythonBoolean } from '../../format';

/**
 * Параметры для генерации проверки автоперехода
 */
export interface AutoTransitionCheckParams {
  nodeId: string;
  targetNode: any;
  nodes: any[];
  connections: any[];
}

/**
 * Генерирует Python-код для проверки автоперехода
 * 
 * @param params - Параметры автоперехода
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCheck(
  params: AutoTransitionCheckParams,
  indent: string = '    '
): string {
  const { nodeId, targetNode, nodes, connections } = params;
  
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Проверяем автопереход сразу после отправки сообщения\n`;
  code += `${indent}const currentNodeForAutoTransition = nodes.find(n => n.id === "${nodeId}")\n`;
  code += `${indent}\n`;
  code += `${indent}# Для узлов без кнопок проверяем автопереход либо по флагу enableAutoTransition, либо по единственному соединению\n`;
  code += `${indent}let autoTransitionTarget: string | null = null\n`;
  code += `${indent}\n`;
  code += `${indent}# Сначала проверяем явный автопереход через флаг\n`;
  code += `${indent}if (currentNodeForAutoTransition?.data?.enableAutoTransition && currentNodeForAutoTransition?.data?.autoTransitionTo) {\n`;
  code += `${indent}    autoTransitionTarget = currentNodeForAutoTransition.data.autoTransitionTo\n`;
  code += `${indent}}\n`;
  code += `${indent}\n`;
  code += `${indent}# Если узел не имеет кнопок и имеет ровно одно исходящее соединение, делаем автопереход\n`;
  code += `${indent}else if (currentNodeForAutoTransition && (!currentNodeForAutoTransition.data?.buttons || currentNodeForAutoTransition.data?.buttons.length === 0)) {\n`;
  code += `${indent}    const outgoingConnections = connections.filter(conn => conn && conn.source === "${nodeId}")\n`;
  code += `${indent}    if (outgoingConnections.length === 1) {\n`;
  code += `${indent}        autoTransitionTarget = outgoingConnections[0].target\n`;
  code += `${indent}    }\n`;
  code += `${indent}}\n`;
  
  return code;
}

/**
 * Генерирует Python-код для выполнения автоперехода
 * 
 * @param autoTransitionTarget - Целевой узел автоперехода
 * @param nodeId - ID текущего узла
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCode(
  autoTransitionTarget: string,
  nodeId: string,
  indent: string = '    '
): string {
  const safeFunctionName = autoTransitionTarget.replace(/[^a-zA-Z0-9_]/g, '_');
  
  let code = '';
  code += `${indent}# АВТОПЕРЕХОД: Проверяем, есть ли автопереход для этого узла\n`;
  code += `${indent}user_id = callback_query.from_user.id\n`;
  code += `${indent}has_conditional_keyboard = user_data.get(user_id, {}).get("_has_conditional_keyboard", False)\n`;
  code += `${indent}if has_conditional_keyboard:\n`;
  code += `${indent}    logging.info("⏸️ Автопереход ОТЛОЖЕН: показана условная клавиатура - ждём нажатия кнопки")\n`;
  code += `${indent}elif user_id in user_data and ("waiting_for_input" in user_data[user_id] or "waiting_for_conditional_input" in user_data[user_id]):\n`;
  code += `${indent}    logging.info(f"⏸️ Автопереход ОТЛОЖЕН: ожидаем ввод для узла ${nodeId}")\n`;
  
  return code;
}
