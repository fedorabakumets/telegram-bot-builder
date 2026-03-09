/**
 * @fileoverview Утилита для получения информации о таблице переменной
 *
 * Модуль предоставляет функцию для поиска таблицы БД,
 * в которой хранится системная переменная.
 *
 * @module bot-generator/database/get-table-for-variable
 */

import { SYSTEM_VARIABLE_SOURCES } from '@shared/system-variables-config';

/**
 * Результат поиска таблицы
 */
export interface TableInfo {
  table: string;
  column?: string;
}

/**
 * Получает информацию о таблице для переменной
 *
 * @param varName - Имя переменной
 * @returns Информация о таблице или null
 *
 * @example
 * const info = getTableForVariable('user_ids');
 * // { table: 'user_ids', column: 'user_id' }
 */
export function getTableForVariable(varName: string): TableInfo | null {
  for (const source of SYSTEM_VARIABLE_SOURCES) {
    const field = source.fields.find((f) => f.variableName === varName);
    if (field) {
      return { table: source.table, column: field.column };
    }
  }
  return null;
}
