/**
 * @fileoverview Типы клавиатур для Telegram Bot Builder
 * @module constants/keyboard.types
 */

/**
 * Тип клавиатуры бота
 * @description Определяет расположение кнопок в сообщении
 */
export type KeyboardType = 'inline' | 'reply' | 'none';

/**
 * Действие кнопки
 * @description Определяет, что происходит при нажатии
 */
export type ButtonAction = 'goto' | 'command' | 'url' | 'selection' | 'complete';

/**
 * Константы типов клавиатуры
 * @description Используйте вместо строковых литералов
 */
export const KEYBOARD_TYPES = {
  /** Кнопки под сообщением (inline) */
  INLINE: 'inline' as KeyboardType,
  /** Кнопки в поле ввода (reply) */
  REPLY: 'reply' as KeyboardType,
  /** Без клавиатуры */
  NONE: 'none' as KeyboardType
} as const;

/**
 * Константы действий кнопок
 */
export const BUTTON_ACTIONS = {
  /** Переход к другому узлу */
  GOTO: 'goto' as ButtonAction,
  /** Выполнение команды */
  COMMAND: 'command' as ButtonAction,
  /** Открытие URL */
  URL: 'url' as ButtonAction,
  /** Выбор опции */
  SELECTION: 'selection' as ButtonAction,
  /** Завершение */
  COMPLETE: 'complete' as ButtonAction
} as const;
