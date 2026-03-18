/**
 * @fileoverview Переопределения полей NodeData для совместимости со схемой
 * 
 * Модуль содержит типы для полей, которые отличаются в NodeData и Node из схемы.
 * Используется для создания совместимого типа EnhancedNode.
 * 
 * @module bot-generator/types/node-data-override-types
 */

import type { FormatMode } from './node-data.types';
import type { ButtonAction } from './button-types';

/**
 * Тип действия кнопки для совместимости
 *
 * @example
 * const action: ButtonActionOverride = 'goto';
 */
export type ButtonActionOverride = ButtonAction;

/**
 * Тип кнопки для совместимости со схемой
 *
 * @example
 * const button: ButtonOverride = { id: '1', text: 'Меню', action: 'goto' };
 */
export interface ButtonOverride {
  /** Уникальный идентификатор кнопки */
  id: string;
  /** Текст кнопки */
  text: string;
  /** Действие кнопки */
  action: ButtonActionOverride;
  /** Целевой узел */
  target?: string;
  /** URL для внешних ссылок */
  url?: string;
  /** Пропускать сбор данных */
  skipDataCollection?: boolean;
  /** Скрыть после нажатия */
  hideAfterClick?: boolean;
  /** Запрос контакта */
  requestContact?: boolean;
  /** Запрос геолокации */
  requestLocation?: boolean;
}

/**
 * Тип клавиатуры для совместимости
 * 
 * @example
 * const type: KeyboardTypeOverride = 'inline';
 */
export type KeyboardTypeOverride = 'reply' | 'inline' | 'none';

/**
 * Режим форматирования для совместимости
 * 
 * @example
 * const mode: FormatModeOverride = 'html';
 */
export type FormatModeOverride = FormatMode;
