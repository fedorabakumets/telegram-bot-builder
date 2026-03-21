/**
 * @fileoverview Генерация кода для обработки fallback узлов
 * Делегирует в formatTextForPython + прямую генерацию
 * @module bot-generator/transitions/generate-fallback-node
 */

import { formatTextForPython } from '../format';

export function generateFallbackNode(node: any, indent: string = '                '): string {
  const formattedText = formatTextForPython(node.data.messageText || 'Сообщение');
  return `${indent}await fake_message.answer(${formattedText})\n${indent}logging.info(f"Отправлено сообщение узла ${node.id}")\n`;
}
