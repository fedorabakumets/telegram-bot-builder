/**
 * @fileoverview Параметры для шаблона обработчика команд
 * @module templates/command/command.params
 */

import type { Button } from '../../bot-generator/types/button-types';
import type { ConditionalMessage } from '../../bot-generator/node-navigation/handle-conditional-messages';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика команды */
export interface CommandTemplateParams {
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Команда (например, "/help") */
  command: string;

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

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages?: boolean;
  /** Массив условных сообщений */
  conditionalMessages?: ConditionalMessage[];
  /** Запасное сообщение */
  fallbackMessage?: string;

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
  /** Синонимы команды */
  synonyms?: string[];
}
