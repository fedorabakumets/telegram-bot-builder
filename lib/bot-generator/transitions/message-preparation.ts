/**
 * @fileoverview Подготовка текста сообщения и переменных БД
 *
 * Модуль генерирует Python-код для подготовки текста сообщения,
 * получения переменных из базы данных и замены переменных в тексте.
 *
 * @module bot-generator/transitions/message-preparation
 */

import { generateDatabaseVariablesCode } from '../Broadcast/generate-database-variables-universal';
import { generateInitAllUserVarsCall } from '../database/generate-init-all-user-vars';

/**
 * Параметры для подготовки сообщения
 */
export interface MessagePreparationParams {
  /** ID узла */
  nodeId: string;
  /** Текст сообщения */
  messageText?: string;
  /** Есть ли переменная ввода */
  hasInputVariable?: boolean;
  /** Имя переменной ввода */
  inputVariable?: string;
}

/**
 * Генерирует код подготовки текста сообщения
 *
 * @param params - Параметры подготовки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateMessageText(messageText?: string, indent: string = '    '): string {
  const text = messageText || 'Сообщение';
  const escapedText = text.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');
  return `${indent}text = "${escapedText}"\n`;
}

/**
 * Генерирует код получения переменных из БД
 *
 * @param indent - Отступ для кода
 * @param messageText - Текст сообщения для анализа используемых переменных
 * @returns Сгенерированный Python-код
 */
export function generateDatabaseVarsGet(indent: string = '    ', messageText?: string): string {
  let code = '';
  code += `${indent}# Инициализация all_user_vars из БД и локального хранилища\n`;
  code += `${generateInitAllUserVarsCall('user_id', 'all_user_vars', indent)}\n`;

  // Извлекаем все переменные из текста сообщения
  const usedVariables = messageText ?
    [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map(m => m[1]) :
    undefined;

  // Генерируем код только для нужных таблиц
  code += `${indent}# Получаем переменные из базы данных\n`;
  code += generateDatabaseVariablesCode(indent, usedVariables);

  return code;
}

/**
 * Генерирует код замены переменных в тексте
 *
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateVariableReplacement(indent: string = '    '): string {
  let code = '';
  code += `${indent}# Заменяем переменные в тексте\n`;
  code += `${indent}# Получаем фильтры переменных для замены\n`;
  code += `${indent}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})\n`;
  code += `${indent}text = replace_variables_in_text(text, all_user_vars, variable_filters)\n`;
  return code;
}

/**
 * Генерирует полный код подготовки сообщения
 *
 * @param params - Параметры подготовки
 * @param indent - Отступ для кода
 * @returns Сгенерированный Python-код
 */
export function generateFullMessagePreparation(
  params: MessagePreparationParams,
  indent: string = '    '
): string {
  let code = '';

  // Подготовка текста
  code += generateMessageText(params.messageText, indent);
  code += '\n';

  // Получение переменных из БД (только если нужны)
  code += generateDatabaseVarsGet(indent, params.messageText);
  code += '\n';

  // Замена переменных
  code += generateVariableReplacement(indent);

  return code;
}
