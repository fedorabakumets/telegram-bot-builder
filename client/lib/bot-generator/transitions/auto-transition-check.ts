/**
 * @fileoverview Проверка автоперехода
 *
 * Модуль генерирует Python-код для проверки и вычисления цели автоперехода
 * на основе флага enableAutoTransition или количества соединений узла.
 *
 * @module bot-generator/transitions/auto-transition-check
 */

import type { AutoTransitionCheckParams } from './types/auto-transition-check-params';

/**
 * Генерирует код проверки автоперехода
 *
 * @param params - Параметры проверки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateAutoTransitionCheck(
  params: AutoTransitionCheckParams,
  indent: string = '    '
): string {
  const { nodeId, targetNode, connections } = params;

  let code = '';
  code += `${indent}# Проверка автоперехода\n`;
  code += `${indent}autoTransitionTarget = None\n`;

  // Проверяем явный автопереход
  if (targetNode.data?.enableAutoTransition && targetNode.data?.autoTransitionTo) {
    code += `${indent}if "${targetNode.data.autoTransitionTo}":\n`;
    code += `${indent}    autoTransitionTarget = "${targetNode.data.autoTransitionTo}"\n`;
  }

  // Проверяем автопереход по количеству соединений
  if (!targetNode.data?.buttons || targetNode.data.buttons.length === 0) {
    const outgoingConnections = connections.filter(
      conn => conn && conn.source === nodeId
    );
    if (outgoingConnections.length === 1) {
      code += `${indent}if not autoTransitionTarget:\n`;
      code += `${indent}    autoTransitionTarget = "${outgoingConnections[0].target}"\n`;
    }
  }

  return code;
}

/**
 * Вычисляет цель автоперехода
 *
 * @param nodeId - ID узла
 * @param nodeData - Данные узла
 * @param connections - Массив соединений
 * @returns Цель автоперехода или null
 */
export function calculateAutoTransitionTarget(
  nodeId: string,
  nodeData: any,
  connections: any[]
): string | null {
  // Проверяем явный автопереход
  if (nodeData?.enableAutoTransition && nodeData?.autoTransitionTo) {
    return nodeData.autoTransitionTo;
  }

  // Проверяем автопереход по количеству соединений
  if (!nodeData?.buttons || nodeData.buttons.length === 0) {
    const outgoingConnections = connections.filter(
      conn => conn && conn.source === nodeId
    );
    if (outgoingConnections.length === 1) {
      return outgoingConnections[0].target;
    }
  }

  return null;
}
