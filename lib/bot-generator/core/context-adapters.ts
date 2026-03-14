/**
 * @fileoverview Адаптеры для миграции на GenerationContext
 * 
 * Модуль предоставляет функции-обёртки для обратной совместимости
 * при миграции на использование GenerationContext.
 * 
 * @module bot-generator/core/context-adapters
 */

import type { GenerationContext } from './generation-context';
import { createContextParams, type GenerationParams } from './context-helpers';

/**
 * Создаёт обёртку для generateNodeNavigation
 *
 * @param context - Контекст генерации
 * @returns Функция для генерации навигации
 *
 * @deprecated Используется только для обратной совместимости
 */
export function createNodeNavigationAdapter(
  _context: GenerationContext
): (
  _baseIndent: string,
  _nextNodeIdVar: string,
  _messageVar: string,
  _userVarsVar: string
) => string {
  // Заглушка для обратной совместимости
  return () => '';
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
): GenerationParams {
  return createContextParams(context, baseIndent);
}
