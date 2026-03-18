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
  return text.replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t');
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
    .replace(/"/g, '\\"');
  return `'${escaped}'`;
}

/**
 * Форматирует текст для вставки в Python код (тройные кавычки для многострочного)
 */
export function formatTextForPython(text: string): string {
  if (!text) return '""';
  if (text.includes('\n')) return `"""${text}"""`;
  return `"${text.replace(/"/g, '\\"')}"`;
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
 * Генерирует Python-код для определения переменной текста сообщения
 */
export function generateMessageText(options: GenerateMessageTextOptions): string[] {
  const { node, indent, variableName = 'text' } = options;
  const lines: string[] = [];
  const messageText = node.data?.messageText || '';
  lines.push(`${indent}# Текст сообщения из узла`);
  if (messageText.includes('\n')) {
    const escapedText = messageText.replace(/"""/g, '\\"\\"\\"');
    lines.push(`${indent}${variableName} = """${escapedText}"""`);
  } else {
    const escapedText = messageText.replace(/"/g, '\\"');
    lines.push(`${indent}${variableName} = "${escapedText}"`);
  }
  lines.push('');
  return lines;
}

/**
 * Генерирует Python-код для безопасной записи в CSV файл
 */
export function generateSafeCsvWrite(
  csvFileVar: string,
  dataVar: string,
  indent: string = '                '
): string {
  let code = '';
  code += `${indent}try:\n`;
  code += `${indent}    # Проверяем наличие файла\n`;
  code += `${indent}    if os.path.exists(${csvFileVar}):\n`;
  code += `${indent}        with open(${csvFileVar}, 'r', encoding='utf-8') as f:\n`;
  code += `${indent}            existing_ids = [line.strip() for line in f if line.strip()]\n`;
  code += `${indent}            if str(${dataVar}).strip() in existing_ids:\n`;
  code += `${indent}                logging.info(f"⚠️ ID {${dataVar}} уже есть в CSV, пропускаем")\n`;
  code += `${indent}                return\n`;
  code += `${indent}    \n`;
  code += `${indent}    # Записываем ID в файл\n`;
  code += `${indent}    with open(${csvFileVar}, 'a', encoding='utf-8') as f:\n`;
  code += `${indent}        f.write(f"{${dataVar}}\\n")\n`;
  code += `${indent}    logging.info(f"✅ ID {${dataVar}} записан в CSV файл: {${csvFileVar}}")\n`;
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"❌ Ошибка записи в CSV: {e}")\n`;
  return code;
}

/**
 * Генерирует Python-код для чтения из CSV файла с обработкой ошибок
 */
export function generateSafeCsvRead(
  csvFileVar: string,
  resultVar: string,
  indent: string = '                '
): string {
  let code = '';
  code += `${indent}try:\n`;
  code += `${indent}    ${resultVar} = []\n`;
  code += `${indent}    if os.path.exists(${csvFileVar}):\n`;
  code += `${indent}        with open(${csvFileVar}, 'r', encoding='utf-8') as f:\n`;
  code += `${indent}            ${resultVar} = [line.strip() for line in f if line.strip()]\n`;
  code += `${indent}except Exception as e:\n`;
  code += `${indent}    logging.error(f"❌ Ошибка чтения CSV: {e}")\n`;
  code += `${indent}    ${resultVar} = []\n`;
  return code;
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
