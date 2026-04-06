/**
 * @fileoverview Утилита для экранирования строк в Python коде
 * @module bot-generator/format/escapeForPython
 */

/**
 * Экранирует строку для безопасного встраивания в Python строковый литерал
 * с двойными кавычками.
 *
 * Порядок замен важен: обратный слеш экранируется первым, иначе
 * последующие замены создадут двойное экранирование.
 *
 * Экранирует:
 * - `\` → `\\` (первым!)
 * - `"` → `\"`
 * - `\n` → `\\n`
 * - `\r` → `\\r`
 * - `\t` → `\\t`
 *
 * Одинарные кавычки `'` не экранируются — они безопасны внутри двойных кавычек Python.
 *
 * @param text - Исходная строка для экранирования
 * @returns Экранированная строка без обрамляющих кавычек
 *
 * @example
 * escapeForPython('Hello "world"')   // → 'Hello \\"world\\"'
 * escapeForPython('C:\\Users\\test') // → 'C:\\\\Users\\\\test'
 * escapeForPython("It's fine")       // → "It's fine"
 * escapeForPython('line1\nline2')    // → 'line1\\nline2'
 */
export function escapeForPython(text: string): string {
  return text
    .replace(/\\/g, '\\\\')   // \ → \\ (должен быть первым!)
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}
