/**
 * @fileoverview Параметры для шаблона клавиатуры
 * @module templates/keyboard/keyboard.params
 */

import type { Button } from '../../bot-generator/transitions/types/button-response-config-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

export type { Button } from '../../bot-generator/transitions/types/button-response-config-types';
export type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Тип режима форматирования */
export type ParseModeType = 'html' | 'markdown' | 'none';

/** Кнопка завершения для множественного выбора */
export interface CompleteButton {
  text: string;
  target: string;
}

/** Расширенная кнопка с pre-computed shortButtonId */
export interface ButtonWithShortId extends Button {
  shortButtonId?: string;
}

/** Условное сообщение */
export interface ConditionalMessage {
  variable: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string;
  message: string;
  keyboard?: string;
}

/** Параметры для генерации клавиатуры */
export interface KeyboardTemplateParams {
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Кнопки */
  buttons?: ButtonWithShortId[];
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard?: boolean;
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard?: boolean;

  // Множественный выбор
  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Имя переменной для хранения выборов */
  multiSelectVariable?: string;
  /** ID узла для callback_data */
  nodeId?: string;
  /** Кнопка завершения */
  completeButton?: CompleteButton;

  // Условные сообщения
  /** Включить условные сообщения */
  enableConditionalMessages?: boolean;
  /** Массив условий */
  conditionalMessages?: ConditionalMessage[];
  /** Имя переменной условной клавиатуры */
  conditionalKeyboardVar?: string;

  // Медиа
  /** Есть ли изображение */
  hasImage?: boolean;
  /** URL изображения */
  imageUrl?: string;
  /** URL документа */
  documentUrl?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;

  // Форматирование
  /** Режим форматирования */
  parseMode?: ParseModeType;

  // Служебные
  /** Уровень отступа */
  indentLevel?: string;
  /** Массив всех ID узлов */
  allNodeIds?: string[];
  /** Короткий ID узла (pre-computed) */
  shortNodeId?: string;
}
