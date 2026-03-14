/**
 * @fileoverview Генерация подготовки текста сообщения
 *
 * Модуль создаёт Python-код для подготовки текста сообщения
 * и получения переменных из базы данных для замены.
 *
 * @module bot-generator/transitions/message-text/generate-message-text-preparation
 */

import { formatTextForPython } from '../../format';
import { generateDatabaseVariablesCode } from '../../Broadcast/generate-database-variables-universal';
import { generateVariableFilterCode } from '../../user-input/generate-variable-filters';

/**
 * Параметры для генерации подготовки текста
 */
export interface MessageTextPreparationParams {
  nodeId: string;
  messageText?: string;
  variableFilters?: Record<string, string>;
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
  const { nodeId, messageText, variableFilters } = params;
  const text = messageText || "Сообщение не задано";
  const formattedText = formatTextForPython(text);

  let code = '';
  code += `${indent}# Обрабатываем узел ${nodeId}\n`;
  code += `${indent}text = ${formattedText}\n`;

  // Добавляем обработку фильтров переменных
  if (variableFilters && Object.keys(variableFilters).length > 0) {
    code += `${indent}\n`;
    code += `${indent}# Обработка фильтров переменных\n`;
    Object.entries(variableFilters).forEach(([varName, filter]) => {
      const filterCode = generateVariableFilterCode(varName, filter, indent);
      if (filterCode) {
        code += `${filterCode}\n`;
        // Заменяем {var|filter} на {var_filtered} в тексте
        const filteredPlaceholder = `{${varName}${filter}}`;
        const newPlaceholder = `{${varName}_filtered}`;
        // Обновляем formattedText для использования _filtered переменной
        code += `${indent}text = text.replace("${filteredPlaceholder}", "{" + "${varName}_filtered" + "}")\n`;
      }
    });
  }

  return code;
}

/**
 * Генерирует Python-код для получения переменных из БД
 *
 * @param indent - Отступ для форматирования кода
 * @param messageText - Текст сообщения для анализа используемых переменных
 * @returns Сгенерированный Python-код
 */
export function generateDatabaseVarsGet(
  indent: string = '    ',
  messageText?: string
): string {
  let code = '';
  code += `${indent}\n`;
  
  // Извлекаем все переменные из текста сообщения
  const usedVariables = messageText ? 
    [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map(m => m[1]) : 
    undefined;
  
  code += `${indent}# Получаем переменные из базы данных\n`;
  code += generateDatabaseVariablesCode(indent, usedVariables);
  code += `${indent}\n`;

  return code;
}
