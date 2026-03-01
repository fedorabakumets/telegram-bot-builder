/**
 * @fileoverview Типы для генерации Python-кода бота
 * 
 * Модуль определяет типы для процесса генерации, включая контекст,
 * опции и результаты генерации кода.
 * 
 * @module bot-generator/types/generation.types
 */

import type { BotNode } from './bot-node-types';
import type { Button } from './button-types';

/**
 * Опции генератора Python-кода
 * 
 * @example
 * const options: GenerationOptions = {
 *   enableLogging: true,
 *   enableComments: true
 * };
 */
export interface GenerationOptions {
  /** Включить логирование */
  enableLogging?: boolean;
  /** Включить комментарии в коде */
  enableComments?: boolean;
  /** Включить базу данных пользователей */
  userDatabaseEnabled?: boolean;
  /** Включить обработчики групп */
  enableGroupHandlers?: boolean;
}

/**
 * Контекст генерации кода
 * 
 * @example
 * const context: GenerationContext = {
 *   nodes: [...],
 *   allNodeIds: ['start_1', 'menu_2'],
 *   options: { enableLogging: true }
 * };
 */
export interface GenerationContext {
  /** Все узлы бота */
  nodes: BotNode[];
  /** Массив всех ID узлов */
  allNodeIds: string[];
  /** Опции генерации */
  options: GenerationOptions;
  /** Карта медиапеременных */
  mediaVariablesMap?: Map<string, string>;
}

/**
 * Результат проверки сбора пользовательского ввода
 * 
 * @example
 * const result: InputCollectionCheckResult = {
 *   hasCollectInput: true,
 *   hasInputValidation: false
 * };
 */
export interface InputCollectionCheckResult {
  /** Есть ли сбор ввода */
  hasCollectInput: boolean;
  /** Есть ли валидация ввода */
  hasInputValidation: boolean;
  /** Есть ли обработка кнопок ответа */
  hasButtonResponseHandlers: boolean;
  /** Есть ли обработка команд */
  hasCommandHandlers: boolean;
}

/**
 * Результат валидации Python-кода
 * 
 * @example
 * const result: PythonValidationResult = {
 *   isValid: true,
 *   missingComponents: []
 * };
 */
export interface PythonValidationResult {
  /** Код валиден */
  isValid: boolean;
  /** Список отсутствующих компонентов */
  missingComponents: string[];
  /** Сообщение об ошибке */
  errorMessage?: string;
}

/**
 * Параметры для генерации импортов
 * 
 * @example
 * const params: ImportGeneratorOptions = {
 *   nodes: [...],
 *   userDatabaseEnabled: true
 * };
 */
export interface ImportGeneratorOptions {
  /** Массив узлов бота */
  nodes: BotNode[];
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
  /** Тип кнопки */
  buttonType?: Button['action'];
}
