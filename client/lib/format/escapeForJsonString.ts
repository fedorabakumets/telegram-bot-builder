/**
 * @fileoverview Утилита для экранирования строк в JSON контексте
 * 
 * Этот модуль предоставляет функции для безопасного экранирования
 * специальных символов в строках перед встраиванием в JSON.
 * 
 * @module escapeForJsonString
 */

/**
 * Функция для правильного экранирования строк в JSON контексте.
 * Выполняет экранирование всех специальных символов, которые могут нарушить
 * корректность JSON строки при встраивании в код.
 *
 * Экранирует следующие символы:
 * - Обратный слеш (\) → двойной обратный слеш (\\)
 * - Двойная кавычка (") → экранированная кавычка (\")
 * - Перевод строки (\n) → экранированный перевод строки (\\n)
 * - Возврат каретки (\r) → экранированный возврат каретки (\\r)
 * - Табуляция (\t) → экранированная табуляция (\\t)
 *
 * @param text - Исходная строка для экранирования
 * @returns Экранированная строка, безопасная для использования в JSON
 *
 * @example
 * // Строка с кавычками и переносами
 * const escaped = escapeForJsonString('Hello "world"\nline 2');
 * // Возвращает: 'Hello \"world\"\\nline 2'
 *
 * @example
 * // Строка с табуляцией и обратными слешами
 * const escaped = escapeForJsonString('path\\to\\file\t');
 * // Возвращает: 'path\\\\to\\\\file\\t'
 *
 * @example
 * // Пустая строка
 * const escaped = escapeForJsonString('');
 * // Возвращает: ''
 *
 * @example
 * // Null или undefined
 * const escaped = escapeForJsonString(null as any);
 * // Возвращает: ''
 */
export function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}
