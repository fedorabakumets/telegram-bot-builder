/**
 * @fileoverview Генерация условия if/elif для одного узла
 *
 * Модуль создаёт Python-код условия перехода для конкретного узла.
 * Используется внутри цикла forEach при генерации переходов.
 *
 * @module bot-generator/transitions/generate-conditional-branch
 */

import type { ConditionalBranchParams } from './types/conditional-branch-params';

/**
 * Генерирует Python-код условия if/elif для одного узла
 *
 * @param params - Параметры условия
 * @returns Строка с Python-кодом условия
 */
export function generateConditionalBranch(
  params: ConditionalBranchParams
): string {
  const { index, nodeId, indent = '            ' } = params;
  const condition = index === 0 ? 'if' : 'elif';
  return `${indent}${condition} next_node_id == "${nodeId}":\n`;
}
