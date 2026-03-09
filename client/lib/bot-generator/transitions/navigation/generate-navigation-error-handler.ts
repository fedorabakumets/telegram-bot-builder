/**
 * @fileoverview Генерация обработчика ошибок навигации
 * 
 * Модуль создаёт Python-код для обработки ошибок при переходе
 * к следующему узлу во время переадресации.
 * 
 * @module bot-generator/transitions/navigation/generate-navigation-error-handler
 */

/**
 * Генерирует Python-код для обработчика ошибок навигации
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateNavigationErrorHandler(
  indent: string = '    '
): string {
  let code = '';
  
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n`;
  code += `${indent}\n`;
  code += `${indent}return  # Завершаем обработку после переадресации\n`;
  
  return code;
}

/**
 * Генерирует Python-код для предупреждения о неизвестном узле
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateUnknownNodeWarning(
  indent: string = '        '
): string {
  let code = '';
  
  code += `${indent}else:\n`;
  code += `${indent}    logging.warning(f"Неизвестный следующий узел: {next_node_id}")\n`;
  
  return code;
}

/**
 * Генерирует Python-код для предупреждения об отсутствии узлов
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateNoNodesAvailableWarning(
  indent: string = '        '
): string {
  let code = '';
  
  code += `${indent}# No nodes available for navigation\n`;
  code += `${indent}logging.warning(f"Нет доступных узлов для навигации к {next_node_id}")\n`;
  
  return code;
}
