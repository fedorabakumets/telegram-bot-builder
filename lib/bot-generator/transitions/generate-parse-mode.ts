/**
 * @fileoverview Генерация кода для выбора parse_mode
 * 
 * Модуль создаёт Python-код для определения режима форматирования
 * сообщения (HTML, Markdown или None).
 * 
 * @module bot-generator/transitions/generate-parse-mode
 */

/**
 * Генерирует Python-код для выбора parse_mode
 * 
 * @param node - Узел сообщения с данными форматирования
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateParseMode(
  node: any,
  indent: string = '                '
): string {
  let code = '';
  
  code += `${indent}# Используем parse_mode условного сообщения если он установлен\n`;
  code += `${indent}if "conditional_parse_mode" in locals() and conditional_parse_mode is not None:\n`;
  code += `${indent}    parse_mode = conditional_parse_mode\n`;
  code += `${indent}else:\n`;
  
  if (node.data.formatMode === 'markdown' || node.data.markdown === true) {
    code += `${indent}    parse_mode = ParseMode.MARKDOWN\n`;
  } else if (node.data.formatMode === 'html') {
    code += `${indent}    parse_mode = ParseMode.HTML\n`;
  } else {
    code += `${indent}    parse_mode = None\n`;
  }
  
  return code;
}
