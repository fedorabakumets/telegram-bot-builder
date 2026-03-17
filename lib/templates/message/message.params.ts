/**
 * @fileoverview Параметры для шаблона сообщения
 * @module templates/message/message.params
 */

import type { Button } from '../../bot-generator/transitions/types/button-response-config-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика сообщения */
export interface MessageTemplateParams {
  // --- Идентификация ---
  /** ID узла */
  nodeId: string;

  // --- Контент ---
  /** Текст сообщения */
  messageText?: string;
  /** Режим форматирования */
  formatMode?: FormatMode;

  // --- Доступ ---
  /** Только приватные чаты */
  isPrivateOnly?: boolean;
  /** Только администраторы */
  adminOnly?: boolean;
  /** Требуется авторизация */
  requiresAuth?: boolean;
  /** База данных пользователей включена */
  userDatabaseEnabled?: boolean;

  // --- Клавиатура ---
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Кнопки */
  buttons?: Button[];
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard?: boolean;
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard?: boolean;

  // --- Множественный выбор ---
  /** Разрешить множественный выбор */
  allowMultipleSelection?: boolean;
  /** Переменная для хранения выборов */
  multiSelectVariable?: string;

  // --- Автопереход ---
  /** Автопереход включён */
  enableAutoTransition?: boolean;
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo?: string;

  // --- Сбор ввода ---
  /** Сбор пользовательского ввода включён */
  collectUserInput?: boolean;
  /** Включить текстовый ввод */
  enableTextInput?: boolean;
  /** Включить ввод фото */
  enablePhotoInput?: boolean;
  /** Включить ввод видео */
  enableVideoInput?: boolean;
  /** Включить ввод аудио */
  enableAudioInput?: boolean;
  /** Включить ввод документов */
  enableDocumentInput?: boolean;
  /** Переменная для сохранения ввода */
  inputVariable?: string;
  /** Целевой узел после ввода */
  inputTargetNodeId?: string;
  /** Минимальная длина ввода */
  minLength?: number;
  /** Максимальная длина ввода */
  maxLength?: number;
  /** Добавлять к существующей переменной */
  appendVariable?: boolean;

  // --- Медиа ---
  /** URL изображения */
  imageUrl?: string;
  /** URL документа */
  documentUrl?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** Прикреплённые медиафайлы */
  attachedMedia?: string[];

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages?: boolean;
  /** Массив условных сообщений */
  conditionalMessages?: any[];
  /** Запасное сообщение */
  fallbackMessage?: string;
}
