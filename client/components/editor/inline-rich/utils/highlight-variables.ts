/**
 * @fileoverview Утилита подсветки переменных в HTML редактора
 */

/**
 * Регулярное выражение для поиска переменных вида {name} или {name|filter}
 */
const VARIABLE_REGEX = /\{([^}|]+)(\|[^}]+)?\}/g;

/**
 * Регулярное выражение для поиска и удаления span-обёрток переменных.
 * Нежадный поиск атрибутов гарантирует корректную работу при любом порядке атрибутов.
 */
const VARIABLE_CHIP_REGEX =
  /<span\b[^>]*class="variable-chip"[^>]*>(\{[^}]*\})<\/span>/g;

/**
 * Оборачивает переменные в HTML-строке в span с классом подсветки
 * @param html - HTML строка из редактора
 * @returns HTML строка с обёрнутыми переменными
 */
export function highlightVariables(html: string): string {
  return html.replace(VARIABLE_REGEX, (_match, name: string, filter?: string) => {
    const filterPart = filter ?? '';
    const displayText = `{${name.trim()}${filterPart}}`;
    return `<span class="variable-chip" data-variable="${name.trim()}" contenteditable="false">${displayText}</span>`;
  });
}

/**
 * Убирает обёртку span с переменных, возвращая чистый текст
 * @param html - HTML строка с обёрнутыми переменными
 * @returns HTML строка без обёрток переменных
 */
export function unwrapVariables(html: string): string {
  return html.replace(VARIABLE_CHIP_REGEX, (_match, variableText: string) => variableText);
}
