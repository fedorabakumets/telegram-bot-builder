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
// Примечание: generateInitAllUserVarsCall удалена после миграции на Jinja2
// import { generateInitAllUserVarsCall } from './generate-init-all-user-vars';

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

  // Инициализация all_user_vars через переиспользуемую функцию
  universalVarCodeLines.push(`${indentLevel}# Инициализация all_user_vars из БД и локального хранилища`);
  // Примечание: generateInitAllUserVarsCall удалена, используем inline код
  universalVarCodeLines.push(`${indentLevel}all_user_vars = await init_all_user_vars(user_id)`);
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
