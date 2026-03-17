/**
 * @fileoverview Параметры для шаблона обработчика команды /start
 * @module templates/start/start.params
 */

import type { Button } from '../../bot-generator/transitions/types/button-response-config-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика команды /start */
export interface StartTemplateParams {
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
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
  /** Множественный выбор включен */
  allowMultipleSelection?: boolean;
  /** Переменная для хранения выбора */
  multiSelectVariable?: string;

  // --- Автопереход ---
  /** Автопереход включен */
  enableAutoTransition?: boolean;
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo?: string;

  // --- Сбор ввода ---
  /** Сбор пользовательского ввода включён */
  collectUserInput?: boolean;

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

  // --- Синонимы ---
  /** Синонимы команды /start */
  synonyms?: string[];
}
