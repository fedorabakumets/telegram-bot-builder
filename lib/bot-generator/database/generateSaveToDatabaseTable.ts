/**
 * @fileoverview Универсальное сохранение переменных в таблицы БД
 *
 * Главный модуль для генерации Python-кода сохранения переменных
 * в соответствующие таблицы БД на основе SYSTEM_VARIABLE_SOURCES.
 *
 * @module bot-generator/database/generateSaveToDatabaseTable
 */

import { getTableForVariable } from './get-table-for-variable';
import { generateSaveToBotUsers } from './save-to-bot-users';
import { generateSaveToTable } from './save-to-table';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

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
  const codeLines: string[] = [];

  const appendExpr = appendExpression || (appendMode ? 'True' : 'False');
  const isDynamicAppend = !!appendExpression;

  // bot_users или неизвестная таблица
  if (!tableInfo || tableInfo.table === 'bot_users') {
    const saveCode = generateSaveToBotUsers({
      variableName,
      valueExpression,
      indent,
      appendExpression: appendExpr,
      isVariableNameDynamic
    });
    codeLines.push(saveCode);
  }
  // Любая другая таблица (user_ids, user_telegram_settings, etc.)
  else {
    const saveCode = generateSaveToTable({
      table: tableInfo.table,
      column: tableInfo.column || variableName,
      valueExpression,
      indent,
      appendExpression: appendExpr,
      isDynamicAppend
    });
    codeLines.push(saveCode);
  }

  return processCodeWithAutoComments(codeLines, 'generateSaveToDatabaseTable.ts').join('\n');
}
