/**
 * @fileoverview Тип данных узла для переходов
 * Используется при генерации навигации между узлами
 */

import type { ButtonData } from './button-data';
import type { MediaType } from './media-type';

/**
 * Тип клавиатуры: "inline", "reply", "none"
 */
export type KeyboardType = 'inline' | 'reply' | 'none';

/**
 * Данные узла для переходов
 */
export interface NodeData {
  /** Текст сообщения */
  messageText?: string;
  /** Кнопки узла */
  buttons?: ButtonData[];
  /** Флаг включения автоперехода */
  enableAutoTransition?: boolean;
  /** Цель автоперехода (ID узла) */
  autoTransitionTo?: string;
  /** Переменная для сохранения ввода */
  inputVariable?: string;
  /** Цель перехода после ввода (ID узла) */
  inputTargetNodeId?: string;
  /** Флаг ожидания ввода */
  waitForInput?: boolean;
  /** Тип медиа для вложения */
  attachedMedia?: MediaType[];
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Одноразовая клавиатура */
  oneTimeKeyboard?: boolean;
}
