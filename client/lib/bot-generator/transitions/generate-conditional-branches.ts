/**
 * @fileoverview Генерация условных переходов if/elif для узлов
 * 
 * Модуль создаёт Python-код для проверки next_node_id и выбора
 * соответствующей ветки выполнения для каждого узла.
 * 
 * @module bot-generator/transitions/generate-conditional-branches
 */

/**
 * Генерирует Python-код условных переходов для списка узлов
 * 
 * @param nodes - Массив узлов для генерации переходов
 * @param indent - Отступ для форматирования кода
 * @returns Строка с Python-кодом условий if/elif
 */
export function generateConditionalBranches(
  nodes: any[],
  indent: string = '            '
): string {
  if (nodes.length === 0) {
    return '';
  }

  let code = '';
  
  nodes.forEach((targetNode, index) => {
    const condition = index === 0 ? 'if' : 'elif';
    code += `${condition} next_node_id == "${targetNode.id}":\n`;
  });

  return code;
}
