/**
 * @fileoverview Типы для генерации Python-кода бота
 * 
 * Модуль определяет типы для процесса генерации, включая контекст,
 * опции и результаты генерации кода.
 * 
 * @module bot-generator/types/generation.types
 */

import type { Node } from '@shared/schema';
import type { Button } from './button-types';
export type { GenerationOptions } from '../core/generation-options.types';
export type { GenerationContext } from '../core/generation-context';
export type { InputCollectionCheckResult } from './input-collection-check-result';
export type { PythonValidationResult } from '../validation/validate-generated-python';

/**
 * Параметры для генерации импортов
 */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: Node[];
  /** Включена ли база данных пользователей */
  userDatabaseEnabled: boolean;
  /** Есть ли inline кнопки */
  hasInlineButtons?: boolean;
}

/**
 * Обработчик callback для кнопок
 * 
 * @example
 * const handler: CallbackHandler = {
 *   pattern: 'callback_data',
 *   handlerName: 'handle_callback'
 * };
 */
export interface CallbackHandler {
  /** Паттерн callback данных */
  pattern: string;
  /** Имя функции обработчика */
  handlerName: string;
  /** Действие кнопки */
  action?: Button['action'];
}
