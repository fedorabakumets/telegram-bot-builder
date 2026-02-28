/**
 * @fileoverview Генерация определения переменной текста сообщения
 *
 * Модуль создаёт Python-код для инициализации переменной text
 * из данных узла перед использованием в отправке сообщений.
 *
 * @module bot-generator/utils/generate-message-text
 */

import type { Node } from '@shared/schema';

/**
 * Параметры для генерации текста сообщения
 */
export interface GenerateMessageTextOptions {
  /** Узел с данными сообщения */
  node: Node;
  /** Отступ для каждой строки кода */
  indent: string;
  /** Имя переменной для текста (по умолчанию 'text') */
  variableName?: string;
}

/**
 * Генерирует Python-код для определения переменной текста сообщения
 *
 * @param options - Параметры генерации
 * @returns Массив строк Python кода
 *
 * @example
 * const lines = generateMessageText({
 *   node: { data: { messageText: 'Привет!' } },
 *   indent: '    '
 * });
 */
export function generateMessageText(options: GenerateMessageTextOptions): string[] {
  const { node, indent, variableName = 'text' } = options;
  const lines: string[] = [];
  
  const messageText = node.data?.messageText || '';
  
  lines.push(`${indent}# Текст сообщения из узла`);
  lines.push(`${indent}${variableName} = "${messageText.replace(/"/g, '\\"')}"`);
  lines.push('');
  
  return lines;
}
