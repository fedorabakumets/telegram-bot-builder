/**
 * @fileoverview Генератор функции init_all_user_vars
 *
 * Модуль создаёт Python-код для функции инициализации all_user_vars
 * из базы данных и локального хранилища user_data.
 *
 * Эта функция заменяет дублирующийся код в 5+ местах генератора ботов.
 *
 * @module bot-generator/database/generate-init-all-user-vars
 */

import { processCodeWithAutoComments } from '../utils/generateGeneratedComment';

/**
 * Параметры для генерации функции init_all_user_vars
 */
export interface GenerateInitAllUserVarsParams {
  /** Отступ для кода (по умолчанию '') */
  indent?: string;
  /** Имя переменной user_id (по умолчанию 'user_id') */
  userIdVar?: string;
  /** Имя целевой переменной (по умолчанию 'all_user_vars') */
  targetVar?: string;
  /** Генерировать как функцию или как inline код (по умолчанию 'function') */
  mode?: 'function' | 'inline';
}

/**
 * Генерирует Python-код функции init_all_user_vars
 *
 * @param params - Параметры генерации
 * @returns Строка с Python-кодом функции
 *
 * @example
 * // Генерация функции
 * const code = generateInitAllUserVars({ mode: 'function' });
 *
 * @example
 * // Генерация inline кода
 * const code = generateInitAllUserVars({ mode: 'inline', indent: '    ' });
 */
export function generateInitAllUserVars(
  params: GenerateInitAllUserVarsParams = {}
): string {
  const {
    indent = '',
    userIdVar = 'user_id',
    targetVar = 'all_user_vars',
    mode = 'function',
  } = params;

  const codeLines: string[] = [];

  if (mode === 'function') {
    // Генерация как функция
    codeLines.push('# ┌─────────────────────────────────────────┐');
    codeLines.push('# │    Инициализация all_user_vars          │');
    codeLines.push('# └─────────────────────────────────────────┘');
    codeLines.push('async def init_all_user_vars(user_id: int) -> dict:');
    codeLines.push('    """Инициализирует all_user_vars из БД и локального хранилища');
    codeLines.push('    ');
    codeLines.push('    Args:');
    codeLines.push('        user_id (int): ID пользователя Telegram');
    codeLines.push('        ');
    codeLines.push('    Returns:');
    codeLines.push('        dict: Словарь с переменными пользователя');
    codeLines.push('    """');
    codeLines.push('    all_user_vars = {}');
    codeLines.push('    ');
    codeLines.push('    # Загружаем из БД');
    codeLines.push('    db_user_vars = await get_user_from_db(user_id)');
    codeLines.push('    if not db_user_vars:');
    codeLines.push('        db_user_vars = user_data.get(user_id, {})');
    codeLines.push('    if not isinstance(db_user_vars, dict):');
    codeLines.push('        db_user_vars = user_data.get(user_id, {})');
    codeLines.push('    if db_user_vars and isinstance(db_user_vars, dict):');
    codeLines.push('        all_user_vars.update(db_user_vars)');
    codeLines.push('    ');
    codeLines.push('    # Загружаем из локального хранилища');
    codeLines.push('    local_user_vars = user_data.get(user_id, {})');
    codeLines.push('    if isinstance(local_user_vars, dict):');
    codeLines.push('        all_user_vars.update(local_user_vars)');
    codeLines.push('    ');
    codeLines.push('    return all_user_vars');
    codeLines.push('');
  } else {
    // Генерация как inline код
    codeLines.push(`${indent}# Инициализация all_user_vars из БД и локального хранилища`);
    codeLines.push(`${indent}${targetVar} = await init_all_user_vars(${userIdVar})`);
    codeLines.push('');
  }

  // Применяем автоматическое добавление комментариев
  const processedCode = processCodeWithAutoComments(
    codeLines,
    'generate-init-all-user-vars.ts'
  );

  return processedCode.join('\n');
}

/**
 * Генерирует inline код вызова функции init_all_user_vars
 *
 * @param userIdVar - Имя переменной user_id (по умолчанию 'user_id')
 * @param targetVar - Имя целевой переменной (по умолчанию 'all_user_vars')
 * @param indent - Отступ для кода (по умолчанию '')
 * @returns Строка с Python-кодом вызова
 */
export function generateInitAllUserVarsCall(
  userIdVar: string = 'user_id',
  targetVar: string = 'all_user_vars',
  indent: string = ''
): string {
  return `${indent}${targetVar} = await init_all_user_vars(${userIdVar})`;
}

/**
 * Генерирует код безопасной инициализации all_user_vars с проверкой
 * Используется в местах где all_user_vars может быть уже определён
 *
 * @param userIdSource - Источник user_id (например, 'message.from_user.id')
 * @param indent - Отступ для кода
 * @param indentIn - Дополнительный отступ для внутреннего блока
 * @returns Строка с Python-кодом безопасной инициализации
 */
export function generateInitAllUserVarsSafe(
  userIdSource: string = 'user_id',
  indent: string = '',
  indentIn: string = '    '
): string {
  const codeLines: string[] = [];

  codeLines.push(`${indent}# Инициализация all_user_vars если ещё не создан`);
  codeLines.push(`${indent}if 'all_user_vars' not in locals():`);
  codeLines.push(`${indent}${indentIn}all_user_vars = await init_all_user_vars(${userIdSource})`);
  codeLines.push('');

  return codeLines.join('\n');
}
