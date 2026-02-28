/**
 * @fileoverview Генерация обработчика старого формата
 * 
 * Модуль создаёт Python-код для обработки устаревшего
 * формата конфигурации ожидания ввода.
 * 
 * @module bot-generator/user-input/generate-legacy-format-handler
 */

/**
 * Генерирует Python-код для обработки старого формата
 * 
 * @param indent - Отступ для форматирования кода
 * @returns Код обработчика старого формата
 */
export function generateLegacyFormatHandler(
  indent: string = '        '
): string {
  let code = '';
  code += `${indent}# Обработка старого формата (для совместимости)\n`;
  code += `${indent}# Находим узел для получения настроек\n`;
  return code;
}
