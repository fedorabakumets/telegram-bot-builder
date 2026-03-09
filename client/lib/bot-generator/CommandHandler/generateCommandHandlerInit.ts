/**
 * @fileoverview Генерация инициализации переменных для обработчиков команд
 *
 * Модуль создаёт Python-код для инициализации all_user_vars и получения
 * переменных из базы данных для обработчиков команд (не /start).
 *
 * В отличие от generateStartHandlerInit, эта функция НЕ регистрирует пользователя,
 * а только загружает существующие переменные.
 *
 * @module bot-generator/CommandHandler/generateCommandHandlerInit
 */

import { generateDatabaseVariablesCode } from '../Broadcast/generate-database-variables-universal';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Параметры для генерации инициализации обработчика команд
 */
export interface GenerateCommandHandlerInitParams {
  /** Текст сообщения для анализа используемых переменных */
  messageText?: string;
  /** Отступ для кода (по умолчанию '    ') */
  indent?: string;
}

/**
 * Генерирует Python-код для инициализации all_user_vars и получения переменных из БД
 * для обработчиков команд
 *
 * @param params - Параметры генерации
 * @returns Строка с Python-кодом инициализации
 *
 * @example
 * const code = generateCommandHandlerInit({
 *   messageText: 'Ваш баланс: {balance}, ID: {user_ids}'
 * });
 */
export function generateCommandHandlerInit(
  params: GenerateCommandHandlerInitParams = {}
): string {
  const { messageText = '', indent = '    ' } = params;
  const codeLines: string[] = [];

  // Шаг 1: Инициализация all_user_vars
  codeLines.push(`${indent}# Инициализируем all_user_vars пустым словарём`);
  codeLines.push(`${indent}all_user_vars = {}`);
  codeLines.push(`${indent}# Получаем переменные из БД`);
  codeLines.push(`${indent}db_user_vars = await get_user_from_db(user_id)`);
  codeLines.push(`${indent}if not db_user_vars:`);
  codeLines.push(`${indent}    db_user_vars = user_data.get(user_id, {})`);
  codeLines.push(`${indent}# Проверяем что db_user_vars это dict`);
  codeLines.push(`${indent}if not isinstance(db_user_vars, dict):`);
  codeLines.push(`${indent}    db_user_vars = user_data.get(user_id, {})`);
  codeLines.push(`${indent}# Обновляем all_user_vars из БД`);
  codeLines.push(`${indent}if db_user_vars and isinstance(db_user_vars, dict):`);
  codeLines.push(`${indent}    all_user_vars.update(db_user_vars)`);
  codeLines.push(`${indent}# Получаем локальные переменные из user_data`);
  codeLines.push(`${indent}local_user_vars = user_data.get(user_id, {})`);
  codeLines.push(`${indent}if isinstance(local_user_vars, dict):`);
  codeLines.push(`${indent}    all_user_vars.update(local_user_vars)`);
  codeLines.push('');

  // Шаг 2: Добавляем переменные из таблиц БД (user_ids, user_ids_count, etc.)
  codeLines.push(`${indent}# Добавляем переменные из таблиц БД`);
  const usedVariables = messageText
    ? [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map((m) => m[1])
    : undefined;
  const databaseVarsCode = generateDatabaseVariablesCode(indent, usedVariables);
  codeLines.push(databaseVarsCode);

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(
    codeLines,
    'generateCommandHandlerInit.ts'
  );
  return processedCode.join('\n');
}
