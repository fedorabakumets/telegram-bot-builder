/**
 * @fileoverview Универсальное сохранение переменных в таблицы БД
 *
 * Главный модуль для генерации Python-кода сохранения переменных
 * в соответствующие таблицы БД на основе SYSTEM_VARIABLE_SOURCES.
 *
 * @module bot-generator/database/generateSaveToDatabaseTable
 */

import { renderPartialTemplate } from '../../templates/template-renderer';
import { getTableForVariable } from './get-table-for-variable';

export interface GenerateSaveToDatabaseTableParams {
  variableName: string;
  valueExpression: string;
  indent?: string;
  appendMode?: boolean;
  appendExpression?: string;
  isVariableNameDynamic?: boolean;
}

/**
 * Генерирует код сохранения переменной в таблицу БД
 *
 * @param params - Параметры генерации
 * @returns Строка с Python-кодом
 */
export function generateSaveToDatabaseTable(
  params: GenerateSaveToDatabaseTableParams
): string {
  const {
    variableName,
    valueExpression,
    indent = '    ',
    appendMode = false,
    appendExpression,
    isVariableNameDynamic = false
  } = params;

  const tableInfo = getTableForVariable(variableName);

  // Определяем appendMode: если есть appendExpression, используем его как boolean
  const effectiveAppendMode = appendExpression 
    ? (appendExpression === 'True' || appendExpression === 'true')
    : appendMode;

  // bot_users или неизвестная таблица
  if (!tableInfo || tableInfo.table === 'bot_users') {
    return renderPartialTemplate('database/save-to-bot-users.py.jinja2', {
      variableName: isVariableNameDynamic ? variableName : variableName,
      valueExpression,
      appendMode: effectiveAppendMode,
      indentLevel: indent,
    });
  } else {
    // Любая другая таблица (user_ids, user_telegram_settings, etc.)
    return renderPartialTemplate('database/save-to-table.py.jinja2', {
      tableName: tableInfo.table,
      columnName: tableInfo.column || variableName,
      valueExpression,
      appendMode: effectiveAppendMode,
      indentLevel: indent,
    });
  }
}
