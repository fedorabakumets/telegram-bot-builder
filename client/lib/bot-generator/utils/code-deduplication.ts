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
 * @param {string} code - Сгенерированный код
 * @param {string} functionName - Имя функции
 * @returns {boolean} true если функция уже определена
 */
export function isFunctionDefined(code, functionName) {
  const regex = new RegExp(`^(async\\s+)?def\\s+${functionName}\\s*\\(`, 'm');
  return regex.test(code);
}

/**
 * Проверяет наличие импорта в коде
 *
 * @param {string} code - Сгенерированный код
 * @param {string} importPattern - Паттерн импорта (например, 'import asyncio')
 * @returns {boolean} true если импорт уже есть
 */
export function isImportDefined(code, importPattern) {
  const lines = code.split('\n').slice(0, 100);
  return lines.some(line => line.trim() === importPattern);
}

/**
 * Подсчитывает количество определений функции в коде
 *
 * @param {string} code - Сгенерированный код
 * @param {string} functionName - Имя функции
 * @returns {number} Количество определений
 */
export function countFunctionDefinitions(code, functionName) {
  const regex = new RegExp(`^(async\\s+)?def\\s+${functionName}\\s*\\(`, 'gm');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}
