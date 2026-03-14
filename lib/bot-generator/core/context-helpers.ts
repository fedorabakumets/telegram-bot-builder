/**
 * @fileoverview Helper-функции для работы с GenerationContext
 * 
 * Модуль предоставляет утилиты для извлечения данных из контекста
 * и создания параметров для генерации кода.
 * 
 * @module bot-generator/core/context-helpers
 */

import type { GenerationContext, SectionContext } from './generation-context';

/**
 * Параметры для генерации кода
 * 
 * @example
 * const params = getContextParams(context);
 */
export interface GenerationParams {
  /** Отступ для генерации */
  indent: string;
  /** Имя переменной для ID следующего узла */
  nextNodeIdVar: string;
  /** Имя переменной для сообщения */
  messageVar: string;
  /** Имя переменной для пользовательских данных */
  userVarsVar: string;
}

/**
 * Создаёт параметры для генерации из контекста
 * 
 * @param context - Контекст генерации
 * @param indent - Базовый отступ (по умолчанию '    ')
 * @returns Параметры для генерации
 * 
 * @example
 * const params = createContextParams(context, '        ');
 */
export function createContextParams(
  _context: GenerationContext,
  indent: string = '    '
): GenerationParams {
  return {
    indent,
    nextNodeIdVar: 'next_node_id',
    messageVar: 'message',
    userVarsVar: 'user_vars',
  };
}

/**
 * Создаёт контекст секции с параметрами
 * 
 * @param context - Базовый контекст
 * @param indent - Отступ для секции
 * @returns Контекст секции
 * 
 * @example
 * const sectionCtx = createSectionContextWithParams(context, '        ');
 */
export function createSectionContextWithParams(
  context: GenerationContext,
  indent: string
): SectionContext {
  return {
    ...context,
    indent,
  };
}

/**
 * Проверяет включено ли логирование в контексте
 * 
 * @param context - Контекст генерации
 * @returns true если логирование включено
 * 
 * @example
 * if (isContextLoggingEnabled(context)) { ... }
 */
export function isContextLoggingEnabled(context: GenerationContext): boolean {
  return context.options.enableLogging ?? false;
}

/**
 * Проверяет включены ли комментарии в контексте
 * 
 * @param context - Контекст генерации
 * @returns true если комментарии включены
 * 
 * @example
 * if (areContextCommentsEnabled(context)) { ... }
 */
export function areContextCommentsEnabled(context: GenerationContext): boolean {
  return context.options.enableComments ?? true;
}

/**
 * Проверяет включена ли база данных пользователей в контексте
 * 
 * @param context - Контекст генерации
 * @returns true если БД пользователей включена
 * 
 * @example
 * if (isContextDatabaseEnabled(context)) { ... }
 */
export function isContextDatabaseEnabled(context: GenerationContext): boolean {
  return context.options.userDatabaseEnabled ?? false;
}
