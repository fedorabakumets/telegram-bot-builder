/**
 * @fileoverview Состояние генерации Python-кода бота
 * 
 * Модуль предоставляет состояние для процесса генерации.
 * Заменяет глобальные переменные loggingEnabled и commentsEnabled.
 * 
 * @module bot-generator/core/generation-state
 */

import type { GenerationOptions } from './generation-options.types';

/**
 * Имена компонентов, которые могут быть сгенерированы только один раз.
 * Используются как ключи в generatedComponents.
 */
export const COMPONENT_NAMES = {
  SAVE_MESSAGE_TO_API: 'save_message_to_api',
  DATABASE: 'database',
  UTILS: 'utils',
  MIDDLEWARE: 'middleware',
  MEDIA_FUNCTIONS: 'media_functions',
  SAFE_EDIT_OR_SEND: 'safe_edit_or_send',
  IMPORTS: 'imports',
  CONFIG: 'config',
  HEADER: 'header',
  MAIN: 'main',
  UNIVERSAL_HANDLERS: 'universal_handlers',
  GROUP_HANDLERS: 'group_handlers',
} as const;

export type ComponentName = typeof COMPONENT_NAMES[keyof typeof COMPONENT_NAMES];

/**
 * Состояние генерации.
 * generatedComponents — мутабельный Set для отслеживания уже эмитированных секций.
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
  /**
   * Множество уже сгенерированных компонентов.
   * Мутабельный — намеренно, чтобы pipeline мог регистрировать эмиссию
   * без создания нового объекта состояния на каждом шаге.
   */
  readonly generatedComponents: Set<string>;
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

/**
 * Генерирует компонент ровно один раз.
 * Если компонент уже был сгенерирован — возвращает пустую строку и логирует предупреждение.
 *
 * @param state - Текущее состояние генерации
 * @param component - Имя компонента (из COMPONENT_NAMES)
 * @param generate - Функция генерации кода
 * @returns Сгенерированный код или '' если компонент уже был эмитирован
 *
 * @example
 * const code = emitOnce(state, COMPONENT_NAMES.DATABASE, () => generateDatabase(...));
 */
export function emitOnce(
  state: GenerationState,
  component: string,
  generate: () => string
): string {
  if (state.generatedComponents.has(component)) {
    // Дублирование — возвращаем пустую строку вместо повторной эмиссии
    return '';
  }
  const code = generate();
  state.generatedComponents.add(component);
  return code;
}
