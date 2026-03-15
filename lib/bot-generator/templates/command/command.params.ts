/**
 * @fileoverview Параметры для шаблона обработчика команд
 * @module templates/command/command.params
 */

import type { Button } from '../transitions/types/button-response-config-types';
import type { ConditionalMessage } from '../node-navigation/handle-conditional-messages';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика команды */
export interface CommandTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
  /** Команда (например, "/help") */
  command: string;
  /** Текст сообщения */
  messageText: string;
  /** Только приватные чаты */
  isPrivateOnly: boolean;
  /** Только администраторы */
  adminOnly: boolean;
  /** Требуется авторизация */
  requiresAuth: boolean;
  /** База данных пользователей включена */
  userDatabaseEnabled: boolean;
  /** Синонимы команды */
  synonyms: string[];
  /** Условные сообщения включены */
  enableConditionalMessages: boolean;
  /** Условные сообщения */
  conditionalMessages: ConditionalMessage[];
  /** Запасное сообщение */
  fallbackMessage: string;
  /** Тип клавиатуры */
  keyboardType: KeyboardType;
  /** Кнопки */
  buttons: Button[];
  /** Режим форматирования */
  formatMode: FormatMode;
  /** Markdown включён */
  markdown: boolean;
  /** URL изображения */
  imageUrl: string;
  /** URL документа */
  documentUrl: string;
  /** URL видео */
  videoUrl: string;
  /** URL аудио */
  audioUrl: string;
  /** Прикреплённые медиа переменные */
  attachedMedia: string[];
}
