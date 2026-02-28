/**
 * @fileoverview Генерация условия if/elif для одного узла
 * 
 * Модуль создаёт Python-код условия перехода для конкретного узла.
 * Используется внутри цикла forEach при генерации переходов.
 * 
 * @module bot-generator/transitions/generate-conditional-branch
 */

/**
 * Генерирует Python-код условия if/elif для одного узла
 * 
 * @param index - Индекс узла в массиве (0 для if, остальные для elif)
 * @param nodeId - ID узла для проверки
 * @param indent - Отступ для форматирования кода
 * @returns Строка с Python-кодом условия
 */
export function generateConditionalBranch(
  index: number,
  nodeId: string,
  indent: string = '            '
): string {
  const condition = index === 0 ? 'if' : 'elif';
  return `${indent}${condition} next_node_id == "${nodeId}":\n`;
}
