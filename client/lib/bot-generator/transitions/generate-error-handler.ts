/**
 * @fileoverview Генерация кода для обработчика ошибок
 * 
 * Модуль создаёт Python-код для обработки исключений
 * при переходе между узлами.
 * 
 * @module bot-generator/transitions/generate-error-handler
 */

/**
 * Генерирует Python-код для обработчика ошибок
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateErrorHandler(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"Ошибка при переходе к следующему узлу {next_node_id}: {e}")\n`;
  code += '\n';
  
  return code;
}
