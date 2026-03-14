/**
 * @fileoverview Константы действий кнопок бота
 * 
 * Модуль содержит все допустимые действия для кнопок клавиатуры.
 * Используется для типизации и валидации кнопок.
 * 
 * @module bot-generator/constants/button-actions
 */

/**
 * Действие кнопки: переход к узлу
 * 
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.GOTO;
 */
export const GOTO = 'goto' as const;

/**
 * Действие кнопки: callback для inline кнопок
 * 
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.CALLBACK;
 */
export const CALLBACK = 'callback' as const;

/**
 * Действие кнопки: открыть URL
 * 
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.URL;
 */
export const URL = 'url' as const;

/**
 * Действие кнопки: выполнить команду
 * 
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.COMMAND;
 */
export const COMMAND = 'command' as const;

/**
 * Действие кнопки: отправить контакт
 * 
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.CONTACT;
 */
export const CONTACT = 'contact' as const;

/**
 * Действие кнопки: отправить геолокацию
 * 
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.LOCATION;
 */
export const LOCATION = 'location' as const;

/**
 * Действие кнопки: выбор опции (multiple selection)
 *
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.SELECTION;
 */
export const SELECTION = 'selection' as const;

/**
 * Действие кнопки: завершение множественного выбора (complete)
 *
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.COMPLETE;
 */
export const COMPLETE = 'complete' as const;

/**
 * Действие кнопки: действие по умолчанию
 *
 * @example
 * const action: ButtonAction = BUTTON_ACTIONS.DEFAULT;
 */
export const DEFAULT = 'default' as const;

/**
 * Все действия кнопок в одном объекте
 *
 * @example
 * const actions = Object.values(BUTTON_ACTIONS);
 */
export const BUTTON_ACTIONS = {
  GOTO,
  CALLBACK,
  URL,
  COMMAND,
  CONTACT,
  LOCATION,
  SELECTION,
  COMPLETE,
  DEFAULT,
} as const;

/**
 * Тип для всех возможных действий кнопок
 * 
 * @example
 * const action: ButtonActionType = 'goto';
 */
export type ButtonActionType = typeof BUTTON_ACTIONS[keyof typeof BUTTON_ACTIONS];
