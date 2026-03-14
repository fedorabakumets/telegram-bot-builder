/**
 * @fileoverview Генерация универсальной замены переменных
 *
 * Модуль создаёт Python-код для инициализации пользовательских переменных
 * и их замены в тексте сообщений.
 *
 * @module bot-generator/database/generateUniversalVariableReplacement
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';
import { generateDatabaseVariablesCode } from '../Broadcast/generate-database-variables-universal';

/**
 * Параметры для генерации универсальной замены переменных
 */
export interface UniversalVariableReplacementParams {
  node?: any;
  indentLevel?: string;
}

/**
 * Генерирует код для универсальной замены переменных
 *
 * @param codeLines - Массив строк кода для добавления
 * @param params - Параметры генерации
 */
export function generateUniversalVariableReplacement(
  codeLines: string[],
  params: UniversalVariableReplacementParams | string = {},
  _oldIndentLevel?: string
): void {
  // Поддержка старого формата вызова (обратная совместимость)
  let indentLevel = '';
  let node = null;
  
  if (typeof params === 'string') {
    indentLevel = params;
    node = null;
  } else {
    indentLevel = params.indentLevel || '';
    node = params.node || null;
  }

  const universalVarCodeLines: string[] = [];

  // Инициализация all_user_vars
  universalVarCodeLines.push(`${indentLevel}# Инициализируем all_user_vars пустым словарём`);
  universalVarCodeLines.push(`${indentLevel}all_user_vars = {}`);

  // Получаем переменные из БД
  universalVarCodeLines.push(`${indentLevel}# Получаем переменные из БД`);
  universalVarCodeLines.push(`${indentLevel}db_user_vars = await get_user_from_db(user_id)`);
  universalVarCodeLines.push(`${indentLevel}if not db_user_vars:`);
  universalVarCodeLines.push(`${indentLevel}    db_user_vars = user_data.get(user_id, {})`);

  // Проверяем что db_user_vars это dict
  universalVarCodeLines.push(`${indentLevel}# Проверяем что db_user_vars это dict`);
  universalVarCodeLines.push(`${indentLevel}if not isinstance(db_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    db_user_vars = user_data.get(user_id, {})`);

  // Обновляем all_user_vars
  universalVarCodeLines.push(`${indentLevel}# Обновляем all_user_vars из БД`);
  universalVarCodeLines.push(`${indentLevel}if db_user_vars and isinstance(db_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    all_user_vars.update(db_user_vars)`);

  // Получаем локальные переменные
  universalVarCodeLines.push(`${indentLevel}# Получаем локальные переменные из user_data`);
  universalVarCodeLines.push(`${indentLevel}local_user_vars = user_data.get(user_id, {})`);
  universalVarCodeLines.push(`${indentLevel}if isinstance(local_user_vars, dict):`);
  universalVarCodeLines.push(`${indentLevel}    all_user_vars.update(local_user_vars)`);
  universalVarCodeLines.push('');

  // Добавляем переменные из таблиц БД (user_ids, user_ids_count, etc.)
  universalVarCodeLines.push(`${indentLevel}# Добавляем переменные из таблиц БД (user_ids, user_ids_count, etc.)`);
  const messageText = node?.data?.messageText || '';
  const usedVariables = messageText
    ? [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map((m) => m[1])
    : undefined;
  const dbVarsCode = generateDatabaseVariablesCode(indentLevel, usedVariables);
  universalVarCodeLines.push(dbVarsCode);

  // Сохраняем фильтры переменных из узла для использования в replace_variables_in_text
  if (node && node.data && node.data.variableFilters) {
    universalVarCodeLines.push(`${indentLevel}# Сохраняем фильтры переменных из узла`);
    universalVarCodeLines.push(`${indentLevel}user_data[user_id]["_variable_filters"] = ${JSON.stringify(node.data.variableFilters)}`);
  }

  // Добавляем функцию замены переменных (только если она еще не была сгенерирована)
  universalVarCodeLines.push(`${indentLevel}# Заменяем все переменные в тексте`);

  // Проверяем, была ли уже сгенерирована функция replace_variables_in_text
  // Функция replace_variables_in_text генерируется только один раз на глобальном уровне
  // Здесь мы только вызываем её для замены переменных

  // Добавляем универсальную замену переменных в тексте
  universalVarCodeLines.push(`${indentLevel}# Заменяем переменные в тексте, если text определена`);
  universalVarCodeLines.push(`${indentLevel}if 'text' not in locals():`);
  universalVarCodeLines.push(`${indentLevel}    text = ""  # Инициализируем пустым текстом если не определена`);
  universalVarCodeLines.push(`${indentLevel}# Получаем фильтры переменных из user_data или используем пустые`);
  universalVarCodeLines.push(`${indentLevel}variable_filters = user_data.get(user_id, {}).get("_variable_filters", {})`);
  universalVarCodeLines.push(`${indentLevel}text = replace_variables_in_text(text, all_user_vars, variable_filters)`);
  universalVarCodeLines.push('');

  // Применяем автоматическое добавление комментариев ко всему коду
  const commentedCodeLines = processCodeWithAutoComments(universalVarCodeLines, 'generateUniversalVariableReplacement.ts');

  // Добавляем обработанные строки в исходный массив
  codeLines.push(...commentedCodeLines);
}
