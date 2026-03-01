/**
 * @fileoverview Состояние генерации Python-кода бота
 * 
 * Модуль предоставляет immutable состояние для процесса генерации.
 * Заменяет глобальные переменные loggingEnabled и commentsEnabled.
 * 
 * @module bot-generator/core/generation-state
 */

import type { GenerationOptions } from './generation-options.types';

/**
 * Immutable состояние генерации
 * 
 * @example
 * const state: GenerationState = {
 *   loggingEnabled: true,
 *   commentsEnabled: true,
 *   generatedComponents: new Set()
 * };
 */
export interface GenerationState {
  /** Включено ли логирование */
  readonly loggingEnabled: boolean;
  /** Включены ли комментарии */
  readonly commentsEnabled: boolean;
  /** Множество сгенерированных компонентов */
  readonly generatedComponents: ReadonlySet<string>;
}

/**
 * Создаёт новое состояние генерации из опций
 * 
 * @param options - Опции генерации
 * @returns Новое состояние генерации
 * 
 * @example
 * const state = createGenerationState({ enableLogging: true });
 */
export function createGenerationState(
  options: GenerationOptions
): GenerationState {
  return {
    loggingEnabled: options.enableLogging ?? false,
    commentsEnabled: options.enableComments ?? true,
    generatedComponents: new Set<string>(),
  };
}

/**
 * Создаёт новое состояние с обновлённым логированием
 * 
 * @param state - Текущее состояние
 * @param enabled - Включить или выключить логирование
 * @returns Новое состояние с обновлённым логированием
 * 
 * @example
 * const newState = withLogging(state, true);
 */
export function withLogging(
  state: GenerationState,
  enabled: boolean
): GenerationState {
  return {
    ...state,
    loggingEnabled: enabled,
  };
}

/**
 * Создаёт новое состояние с обновлёнными комментариями
 * 
 * @param state - Текущее состояние
 * @param enabled - Включить или выключить комментарии
 * @returns Новое состояние с обновлёнными комментариями
 * 
 * @example
 * const newState = withComments(state, false);
 */
export function withComments(
  state: GenerationState,
  enabled: boolean
): GenerationState {
  return {
    ...state,
    commentsEnabled: enabled,
  };
}

/**
 * Отмечает компонент как сгенерированный
 * 
 * @param state - Текущее состояние
 * @param component - Имя сгенерированного компонента
 * @returns Новое состояние с отмеченным компонентом
 * 
 * @example
 * const newState = markComponentGenerated(state, 'database');
 */
export function markComponentGenerated(
  state: GenerationState,
  component: string
): GenerationState {
  const newComponents = new Set(state.generatedComponents);
  newComponents.add(component);
  
  return {
    ...state,
    generatedComponents: newComponents,
  };
}

/**
 * Проверяет, был ли компонент сгенерирован
 * 
 * @param state - Текущее состояние
 * @param component - Имя компонента для проверки
 * @returns true если компонент был сгенерирован
 * 
 * @example
 * const isGenerated = isComponentGenerated(state, 'database');
 */
export function isComponentGenerated(
  state: GenerationState,
  component: string
): boolean {
  return state.generatedComponents.has(component);
}
