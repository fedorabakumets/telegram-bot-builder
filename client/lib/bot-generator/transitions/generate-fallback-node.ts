/**
 * @fileoverview Генерация кода для обработки fallback узлов
 * 
 * Модуль создаёт Python-код для обработки узлов сообщений,
 * которые не попали в основные категории.
 * 
 * @module bot-generator/transitions/generate-fallback-node
 */

import { formatTextForPython } from '../format';

/**
 * Генерирует Python-код для обработки fallback узла
 * 
 * @param node - Узел сообщения
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateFallbackNode(
  node: any,
  indent: string = '                '
): string {
  const messageText = node.data.messageText || 'Сообщение';
  const formattedText = formatTextForPython(messageText);
  
  let code = '';
  code += `${indent}await fake_message.answer(${formattedText})\n`;
  code += `${indent}logging.info(f"Отправлено сообщение узла ${node.id}")\n`;
  
  return code;
}
