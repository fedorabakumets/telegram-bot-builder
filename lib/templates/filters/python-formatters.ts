/**
 * @fileoverview Форматтеры Python кода
 */

/**
 * Создает безопасное имя функции Python из идентификатора узла
 */
export function createSafeFunctionName(nodeId: string): string {
  let safeName = nodeId.replace(/[^a-zA-Z0-9_]/g, '_');
  if (/^\d/.test(safeName)) safeName = 'node_' + safeName;
  return safeName;
}

/**
 * Экранирует строку для JSON контекста
 */
export function escapeForJsonString(text: string): string {
  if (!text) return '';
  return text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
}

/**
 * Экранирует строку для вставки в Python код (двойные кавычки)
 */
export function escapeForPython(text: string): string {
  return text
    .replace(/\\/g, '\\\\')   // \ → \\ (должен быть первым!)
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
}

/**
 * Экранирует значение для безопасного использования в Python строках (одинарные кавычки)
 */
export function escapePythonString(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return 'None';
  if (typeof value === 'number') return value.toString();
  const escaped = value.toString()
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t');
  return `'${escaped}'`;
}

/**
 * Форматирует текст для вставки в Python код.
 * Многострочный текст оборачивается в одинарные тройные кавычки `'''`,
 * чтобы не нужно было экранировать двойные кавычки (они встречаются чаще).
 * Однострочный текст оборачивается в двойные кавычки с полным экранированием.
 *
 * @param text - Исходный текст для форматирования
 * @returns Python-литерал строки (с кавычками)
 *
 * @example
 * formatTextForPython("Привет!")          // → `"Привет!"`
 * formatTextForPython('Он сказал "да"')   // → `"Он сказал \"да\""`
 * formatTextForPython("Строка 1\nСтрока 2") // → `'''Строка 1\nСтрока 2'''`
 * formatTextForPython("Текст с '''")      // → `'''Текст с '\'\'\'`
 */
export function formatTextForPython(text: string): string {
  if (!text) return '""';
  if (text.includes('\n')) {
    // Многострочный режим: одинарные тройные кавычки — двойные кавычки не нужно экранировать
    const escaped = text
      .replace(/\\/g, '\\\\')
      .replace(/'''/g, "'\\'")   // ''' → '\' — разрываем тройную одинарную кавычку
      .replace(/\r/g, '\\r');
    return `'''${escaped}'''`;
  }
  // Однострочный режим: двойные кавычки с полным экранированием
  return `"${text
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\t/g, '\\t')}"`;
}

/**
 * Генерирует текст кнопки с поддержкой переменных
 */
export function generateButtonText(buttonText: string): string {
  if (buttonText.includes('{') && buttonText.includes('}')) {
    return `replace_variables_in_text("${escapeForPython(buttonText)}", all_user_vars, user_data.get(user_id, {}).get("_variable_filters", {}))`;
  }
  return `"${escapeForPython(buttonText)}"`;
}

/**
 * Генерирует уникальный короткий идентификатор для узла
 */
export function generateUniqueShortId(nodeId: string, allNodeIds: string[]): string {
  if (!nodeId) return 'node';
  if (nodeId.endsWith('_interests')) {
    const prefix = nodeId.replace('_interests', '');
    return prefix.substring(0, Math.min(6, prefix.length));
  }
  const baseShortId = nodeId.slice(-10).replace(/^_+/, '');
  const conflicts = allNodeIds.filter(id => id.slice(-10).replace(/^_+/, '') === baseShortId && id !== nodeId);
  if (conflicts.length === 0) return baseShortId;
  return nodeId.replace(/[^a-zA-Z0-9]/g, '').slice(-8);
}

/**
 * Возвращает строку parse_mode для Telegram API
 */
export function getParseMode(formatMode: string): string {
  if (!formatMode || formatMode.trim() === '' || formatMode.trim().toLowerCase() === 'none') return '';
  if (formatMode.toLowerCase() === 'html') return ', parse_mode=ParseMode.HTML';
  if (formatMode.toLowerCase() === 'markdown') return ', parse_mode=ParseMode.MARKDOWN';
  return '';
}

/**
 * Удаляет HTML теги из текста
 */
export function stripHtmlTags(text: string): string {
  if (!text) return text;
  return text.replace(/<[^>]*>/g, '');
}

/**
 * Конвертирует JavaScript boolean в Python boolean ('True'/'False')
 */
export function toPythonBoolean(value: any): string {
  return value ? 'True' : 'False';
}

// ============================================================================
// Генераторы кода
// ============================================================================

import type { Node } from '@shared/schema';

export interface GenerateMessageTextOptions {
  node: Node;
  indent: string;
  variableName?: string;
}

/**
 * Генерирует Python-код для определения переменной текста сообщения.
 * Использует `formatTextForPython` для корректного экранирования.
 * @param options - Параметры генерации
 * @returns Массив строк Python-кода
 */
export function generateMessageText(options: GenerateMessageTextOptions): string[] {
  const { node, indent, variableName = 'text' } = options;
  const lines: string[] = [];
  const messageText = node.data?.messageText || '';
  lines.push(`${indent}# Текст сообщения из узла`);
  lines.push(`${indent}${variableName} = ${formatTextForPython(messageText)}`);
  lines.push('');
  return lines;
}

/**
 * Проверяет наличие определения функции в коде
 */
export function isFunctionDefined(code: string, functionName: string): boolean {
  const regex = new RegExp(`^(async\\s+)?def\\s+${functionName}\\s*\\(`, 'm');
  return regex.test(code);
}

/**
 * Проверяет наличие импорта в коде
 */
export function isImportDefined(code: string, importPattern: string): boolean {
  const lines = code.split('\n').slice(0, 100);
  return lines.some(line => line.trim() === importPattern);
}

/**
 * Подсчитывает количество определений функции в коде
 */
export function countFunctionDefinitions(code: string, functionName: string): number {
  const regex = new RegExp(`^(async\\s+)?def\\s+${functionName}\\s*\\(`, 'gm');
  const matches = code.match(regex);
  return matches ? matches.length : 0;
}
