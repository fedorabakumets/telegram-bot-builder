/**
 * @fileoverview Проверка наличия определения функции в коде
 *
 * Модуль предоставляет утилиты для проверки дублирования
 * определений функций и переменных в сгенерированном коде.
 *
 * @module bot-generator/utils/code-deduplication
 */

/**
 * Проверяет наличие определения функции в коде
 *
 * @param code - Сгенерированный код
 * @param functionName - Имя функции
 * @returns true если функция уже определена
 */
export function isFunctionDefined(code: string, functionName: string): boolean {
  const regex = new RegExp(`^(async\\s+)?def\\s+${functionName}\\s*\\(`, 'm');
  return regex.test(code);
}

/**
 * Проверяет наличие импорта в коде
 *
 * @param code - Сгенерированный код
 * @param importPattern - Паттерн импорта
 * @returns true если импорт уже есть
 */
export function isImportDefined(code: string, importPattern: string): boolean {
  const lines = code.split('\n').slice(0, 100);
  return lines.some(line => line.trim() === importPattern);
}

/**
 * Подсчитывает количество определений функции в коде
 *
 * @param code - Сгенерированный код
 * @param functionName - Имя функции
 * @returns Количество определений
 */
export function countFunctionDefinitions(code: string, functionName: string): number {
  const regex = new RegExp(`^(async\\s+)?def\\s+${functionName}\\s*\\(`, 'gm');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}
