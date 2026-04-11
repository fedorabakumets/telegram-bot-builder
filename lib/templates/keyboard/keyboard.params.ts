/**
 * @fileoverview Параметры для шаблона клавиатуры
 * @module templates/keyboard/keyboard.params
 */

import type { Button } from '../../bot-generator/types/button-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

export type { Button } from '../../bot-generator/types/button-types';
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
  /** Короткий ID кнопки (pre-computed для callback_data) */
  shortButtonId?: string;
  /** Пользовательский callback_data (переопределяет авто-генерируемый) */
  customCallbackData?: string;
  /** URL для Telegram Mini App (только для web_app, требует HTTPS) */
  webAppUrl?: string;
  /** Визуальный стиль кнопки (Bot API 9.4): primary=синий, success=зелёный, danger=красный */
  style?: 'primary' | 'success' | 'danger';
  /** Предложенное имя для создаваемого управляемого бота (Bot API 9.6) */
  suggestedBotName?: string;
  /** Предложенный username для создаваемого управляемого бота (Bot API 9.6) */
  suggestedBotUsername?: string;
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
  // --- Тип и кнопки ---
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

  // --- Множественный выбор ---
  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Переменная для хранения выборов */
  multiSelectVariable?: string;
  /** ID узла для callback_data */
  nodeId?: string;
  /** Кнопка завершения выбора */
  completeButton?: CompleteButton;

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages?: boolean;
  /** Массив условий */
  conditionalMessages?: ConditionalMessage[];
  /** Переменная условной клавиатуры */
  conditionalKeyboardVar?: string;

  // --- Медиа ---
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

  // --- Форматирование ---
  /** Режим форматирования */
  parseMode?: ParseModeType;

  // --- Служебные ---
  /** Уровень отступа */
  indentLevel?: string;
  /** Массив всех ID узлов */
  allNodeIds?: string[];
  /** Короткий ID узла (pre-computed) */
  shortNodeId?: string;
}
