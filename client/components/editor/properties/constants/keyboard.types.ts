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
 * Тип кнопки
 * @description Определяет поведение кнопки
 */
export type ButtonType = 'normal' | 'option' | 'continue';

/**
 * Действие кнопки
 * @description Определяет, что происходит при нажатии
 */
export type ButtonAction = 'goto' | 'command' | 'url';

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
 * Константы типов кнопок
 */
export const BUTTON_TYPES = {
  /** Обычная кнопка */
  NORMAL: 'normal' as ButtonType,
  /** Кнопка опции */
  OPTION: 'option' as ButtonType,
  /** Кнопка продолжения */
  CONTINUE: 'continue' as ButtonType
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
  URL: 'url' as ButtonAction
} as const;
