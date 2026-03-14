/**
 * @fileoverview Контекст генерации Python-кода бота
 * 
 * Модуль определяет контекст для процесса генерации кода.
 * Содержит все данные необходимые для генерации бота.
 * 
 * @module bot-generator/core/generation-context
 */

import type { EnhancedNode } from '../types/enhanced-node.types';
import type { BotGroup } from '@shared/schema';
import type { GenerationOptions } from './generation-options.types';
import type { GenerationState } from './generation-state';

/**
 * Контекст генерации Python-кода
 * 
 * @example
 * const context: GenerationContext = {
 *   nodes: [...],
 *   allNodeIds: ['start_1'],
 *   state: {...},
 *   options: {...}
 * };
 */
export interface GenerationContext {
  /** Все узлы бота */
  readonly nodes: EnhancedNode[];
  /** Массив всех ID узлов */
  readonly allNodeIds: string[];
  /** Карта медиапеременных */
  readonly mediaVariablesMap: Map<string, { type: string; variable: string }>;
  /** Имя бота */
  readonly botName: string;
  /** Группы бота */
  readonly groups: BotGroup[];
  /** Опции генерации */
  readonly options: GenerationOptions;
  /** Состояние генерации */
  readonly state: GenerationState;
  /** ID проекта */
  readonly projectId: number | null;
}

/**
 * Контекст для отдельной секции генерации
 * 
 * @example
 * const sectionContext: SectionContext = {
 *   ...context,
 *   indent: '    '
 * };
 */
export interface SectionContext extends GenerationContext {
  /** Текущий отступ для генерации */
  readonly indent: string;
}

/**
 * Создаёт контекст для секции генерации
 * 
 * @param context - Базовый контекст
 * @param indent - Отступ для секции
 * @returns Контекст секции
 * 
 * @example
 * const sectionCtx = createSectionContext(context, '        ');
 */
export function createSectionContext(
  context: GenerationContext,
  indent: string
): SectionContext {
  return {
    ...context,
    indent,
  };
}
