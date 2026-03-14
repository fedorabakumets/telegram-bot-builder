/**
 * @fileoverview Генератор блока переменных из таблиц базы данных
 * 
 * Модуль создаёт Python-код для блока комментариев о переменных из таблиц БД.
 * Устраняет дублирование кода в 4+ местах генератора ботов.
 * 
 * @module bot-generator/database/generate-database-variables-block
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Опции для генерации блока переменных из БД
 */
export interface DatabaseVariablesBlockOptions {
  /** Таблицы которые не требуются (будут помечены комментарием) */
  notRequiredTables?: string[];
  /** Таблицы которые будут загружены */
  requiredTables?: string[];
  /** Отступ для кода (по умолчанию '') */
  indent?: string;
}

/**
 * Генерирует Python-код блока переменных из таблиц базы данных
 * 
 * @param options - Опции генерации
 * @returns Строка с Python-кодом блока
 * 
 * @example
 * // Генерация блока по умолчанию
 * const code = generateDatabaseVariablesBlock({});
 * 
 * @example
 * // Генерация блока с кастомными таблицами
 * const code = generateDatabaseVariablesBlock({
 *   notRequiredTables: ['bot_users', 'user_settings'],
 *   requiredTables: ['user_ids']
 * });
 */
export function generateDatabaseVariablesBlock(
  options: DatabaseVariablesBlockOptions = {}
): string {
  const {
    notRequiredTables = ['bot_users', 'user_telegram_settings', 'user_ids'],
    requiredTables = [],
    indent = '',
  } = options;

  const codeLines: string[] = [];

  codeLines.push(`${indent}# ┌─────────────────────────────────────────┐`);
  codeLines.push(`${indent}# │    Переменные из таблиц базы данных     │`);
  codeLines.push(`${indent}# └─────────────────────────────────────────┘`);

  // Добавляем комментарии для таблиц которые не требуются
  for (const table of notRequiredTables) {
    codeLines.push(`${indent}# Таблица: ${table} — не требуется`);
  }

  // Добавляем код для таблиц которые будут загружены
  for (const table of requiredTables) {
    codeLines.push(`${indent}# Загрузка из таблицы: ${table}`);
  }

  codeLines.push(`${indent}# Добавляем переменные базы данных в all_user_vars`);
  codeLines.push(`${indent}logging.info(f"🔧 Переменные из БД добавлены в all_user_vars")`);
  codeLines.push('');

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(
    codeLines,
    'generate-database-variables-block.ts'
  );

  return processedCode.join('\n');
}

/**
 * Генерирует вызов блока переменных из БД (для вставки в код)
 * 
 * @param indent - Отступ для кода (по умолчанию '')
 * @returns Строка с Python-кодом вызова
 */
export function generateDatabaseVariablesBlockCall(
  indent: string = ''
): string {
  return generateDatabaseVariablesBlock({ indent });
}
