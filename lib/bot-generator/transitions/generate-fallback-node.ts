/**
 * @fileoverview Генерация кода для обработки fallback узлов
 * Делегирует в formatTextForPython + прямую генерацию
 * @module bot-generator/transitions/generate-fallback-node
 */

import { formatTextForPython } from '../../templates/filters/python-formatters';

/**
 * Формирует отправку запасного сообщения.
 * @param node - Узел сообщения.
 * @param indent - Отступ Python-кода.
 * @returns Код отправки сообщения.
 */
export function generateFallbackNode(node: any, indent: string = '                '): string {
  const formattedText = formatTextForPython(node.data.messageText || 'Сообщение');
  return `${indent}await fake_message.answer(${formattedText})\n${indent}logging.info(f"Отправлено сообщение узла ${node.id}")\n`;
}
