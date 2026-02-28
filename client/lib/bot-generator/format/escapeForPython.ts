/**
 * @fileoverview Утилита для экранирования строк в Python коде
 * 
 * Этот модуль предоставляет функции для безопасного экранирования
 * специальных символов в строках перед встраиванием в Python код.
 * 
 * @module escapeForPython
 */

/**
 * Функция для правильного экранирования строк в Python коде.
 * Выполняет экранирование специальных символов, которые могут нарушить
 * корректность строкового литерала в Python при встраивании в код.
 *
 * Экранирует следующие символы для безопасного использования в Python:
 * - Двойная кавычка (") → экранированная кавычка (\")
 * - Перевод строки (\n) → экранированный перевод строки (\\n)
 * - Возврат каретки (\r) → экранированный возврат каретки (\\r)
 * - Табуляция (\t) → экранированная табуляция (\\t)
 *
 * @param text - Исходная строка для экранирования
 * @returns Экранированная строка, безопасная для использования в Python коде
 *
 * @example
 * // Строка с кавычками и переносами
 * const escaped = escapeForPython('Hello "world"\nline 2');
 * // Возвращает: 'Hello \"world\"\\nline 2'
 * // В Python: "Hello \"world\"\\nline 2"
 *
 * @example
 * // Строка с табуляцией
 * const escaped = escapeForPython('indent\there');
 * // Возвращает: 'indent\\there'
 * // В Python: "indent\\there"
 *
 * @example
 * // Строка с возвратом каретки
 * const escaped = escapeForPython('line1\rline2');
 * // Возвращает: 'line1\\rline2'
 * // В Python: "line1\\rline2"
 *
 * @example
 * // Пустая строка
 * const escaped = escapeForPython('');
 * // Возвращает: ''
 *
 * @example
 * // Строка без специальных символов
 * const escaped = escapeForPython('simple text');
 * // Возвращает: 'simple text'
 */
export function escapeForPython(text: string): string {
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}
