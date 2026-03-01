/**
 * @fileoverview Адаптеры для миграции на GenerationContext
 * 
 * Модуль предоставляет функции-обёртки для обратной совместимости
 * при миграции на использование GenerationContext.
 * 
 * @module bot-generator/core/context-adapters
 */

import type { GenerationContext } from './generation-context';
import { createContextParams } from './context-helpers';

/** Параметры для генерации навигации по узлам */
interface NodeNavigationParams {
  baseIndent: string;
  nextNodeIdVar: string;
  messageVar: string;
  userVarsVar: string;
}

/**
 * Создаёт обёртку для generateNodeNavigation
 * 
 * @param context - Контекст генерации
 * @returns Функция для генерации навигации
 * 
 * @example
 * const generateNav = createNodeNavigationAdapter(context);
 * const code = generateNav('    ', 'next_node_id', 'message', 'user_vars');
 */
export function createNodeNavigationAdapter(
  context: GenerationContext
): (
  baseIndent: string,
  nextNodeIdVar: string,
  messageVar: string,
  userVarsVar: string
) => string {
  return (
    baseIndent: string,
    nextNodeIdVar: string,
    messageVar: string,
    userVarsVar: string
  ) => {
    const params: NodeNavigationParams = {
      baseIndent,
      nextNodeIdVar,
      messageVar,
      userVarsVar,
    };
    
    // Динамический импорт для избежания циклических зависимостей
    return require('../generate/generateNodeNavigation').generateNodeNavigation(
      context,
      params
    );
  };
}

/**
 * Создаёт обёртку для функции с параметрами из контекста
 * 
 * @param context - Контекст генерации
 * @param baseIndent - Базовый отступ
 * @returns Параметры для генерации
 * 
 * @example
 * const params = createNavigationParams(context);
 */
export function createNavigationParams(
  context: GenerationContext,
  baseIndent: string = '    '
): NodeNavigationParams {
  return createContextParams(context, baseIndent);
}
