/**
 * @fileoverview Генерация кода для обработки неизвестных узлов
 * 
 * Модуль создаёт Python-код для логирования неизвестных типов узлов
 * и случаев отсутствия доступных узлов для навигации.
 * 
 * @module bot-generator/transitions/generate-unknown-node-handler
 */

/**
 * Генерирует Python-код для обработки неизвестного узла
 * 
 * @param nodeId - ID узла
 * @param nodeType - Тип узла
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateUnknownNodeHandler(
  nodeId: string,
  nodeType: string,
  indent: string = '                '
): string {
  return `${indent}logging.info(f"Переход к узлу ${nodeId} типа ${nodeType}")\n`;
}

/**
 * Генерирует Python-код для случая неизвестного next_node_id
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateUnknownNextNodeWarning(
  indent: string = '            '
): string {
  let code = '';
  code += `${indent}else:\n`;
  code += `${indent}    logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n`;
  
  return code;
}

/**
 * Генерирует Python-код для случая отсутствия доступных узлов
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateNoNodesAvailableWarning(
  indent: string = '            '
): string {
  return `${indent}# No nodes available for navigation\n${indent}logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n`;
}
