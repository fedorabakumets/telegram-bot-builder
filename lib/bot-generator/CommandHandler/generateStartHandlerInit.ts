/**
 * @fileoverview Генерация инициализации переменных для обработчика /start
 *
 * Модуль создаёт Python-код для инициализации all_user_vars и получения
 * переменных из базы данных (user_ids, user_ids_count, etc.) перед заменой
 * переменных в тексте сообщения.
 *
 * @module bot-generator/CommandHandler/generateStartHandlerInit
 */

import { generateDatabaseVariablesCode } from '../Broadcast/generate-database-variables-universal';
import { generateInitAllUserVarsCall } from '../database/generate-init-all-user-vars';
import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Параметры для генерации инициализации обработчика start
 */
export interface GenerateStartHandlerInitParams {
  /** Текст сообщения для анализа используемых переменных */
  messageText?: string;
  /** Отступ для кода (по умолчанию '    ') */
  indent?: string;
}

/**
 * Генерирует Python-код для инициализации all_user_vars и получения переменных из БД
 *
 * @param params - Параметры генерации
 * @returns Строка с Python-кодом инициализации
 *
 * @example
 * const code = generateStartHandlerInit({
 *   messageText: 'Привет, {user_name}! Список: {user_ids}'
 * });
 */
export function generateStartHandlerInit(
  params: GenerateStartHandlerInitParams = {}
): string {
  const { messageText = '', indent = '    ' } = params;
  const codeLines: string[] = [];

  // Шаг 1: Инициализация all_user_vars через переиспользуемую функцию
  codeLines.push(generateInitAllUserVarsCall('user_id', 'all_user_vars', indent));
  codeLines.push('');

  // Шаг 2: Добавляем переменные из таблиц БД (user_ids, user_ids_count, etc.)
  codeLines.push(`${indent}# Добавляем переменные из таблиц БД (user_ids, user_ids_count, etc.)`);
  const usedVariables = messageText
    ? [...messageText.matchAll(/\{([^}|]+)(?:\|[^}]+)?\}/g)].map((m) => m[1])
    : undefined;
  const databaseVarsCode = generateDatabaseVariablesCode(indent, usedVariables);
  codeLines.push(databaseVarsCode);

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(
    codeLines,
    'generateStartHandlerInit.ts'
  );
  return processedCode.join('\n');
}
