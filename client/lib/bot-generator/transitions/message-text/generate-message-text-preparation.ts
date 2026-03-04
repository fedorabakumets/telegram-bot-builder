/**
 * @fileoverview Генерация подготовки текста сообщения
 *
 * Модуль создаёт Python-код для подготовки текста сообщения
 * и получения переменных из базы данных для замены.
 *
 * @module bot-generator/transitions/message-text/generate-message-text-preparation
 */

import { formatTextForPython } from '../../format';
import { generateDatabaseVariablesCode } from '../../Broadcast/generateDatabaseVariables';

/**
 * Параметры для генерации подготовки текста
 */
export interface MessageTextPreparationParams {
  nodeId: string;
  messageText?: string;
}

/**
 * Генерирует Python-код для подготовки текста сообщения
 *
 * @param params - Параметры подготовки
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateMessageTextPreparation(
  params: MessageTextPreparationParams,
  indent: string = '    '
): string {
  const { nodeId, messageText } = params;
  const text = messageText || "Сообщение не задано";
  const formattedText = formatTextForPython(text);

  let code = '';
  code += `${indent}# Обрабатываем узел ${nodeId}\n`;
  code += `${indent}text = ${formattedText}\n`;

  return code;
}

/**
 * Генерирует Python-код для получения переменных из БД
 *
 * @param indent - Отступ для форматирования кода
 * @returns Сгенерированный Python-код
 */
export function generateDatabaseVarsGet(
  indent: string = '    '
): string {
  let code = '';
  code += `${indent}\n`;
  code += `${indent}# Получаем переменные из базы данных (user_ids_list, user_ids_count)\n`;
  code += generateDatabaseVariablesCode(indent);
  code += `${indent}\n`;

  return code;
}
