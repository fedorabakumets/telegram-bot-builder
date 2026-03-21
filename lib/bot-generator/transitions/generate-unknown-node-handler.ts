/**
 * @fileoverview Генерация кода для обработки неизвестных узлов
 * @module bot-generator/transitions/generate-unknown-node-handler
 */

export function generateUnknownNodeHandler(nodeId: string, nodeType: string, indent: string = '                '): string {
  return `${indent}logging.info(f"Переход к узлу ${nodeId} типа ${nodeType}")\n`;
}

export function generateUnknownNextNodeWarning(indent: string = '            '): string {
  return `${indent}else:\n${indent}    logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n`;
}

export function generateNoNodesAvailableWarning(indent: string = '            '): string {
  return `${indent}# No nodes available for navigation\n${indent}logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n`;
}
