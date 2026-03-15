/**
 * @fileoverview Параметры для шаблона обработчика команды /start
 * @module templates/start/start.params
 */

import type { Button } from '../../transitions/types/button-response-config-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика команды /start */
export interface StartTemplateParams {
  /** Уникальный идентификатор узла */
  nodeId: string;
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
  /** Множественный выбор включен */
  allowMultipleSelection: boolean;
  /** Переменная для хранения выбора */
  multiSelectVariable: string;
  /** Кнопки */
  buttons: Button[];
  /** Тип клавиатуры */
  keyboardType: KeyboardType;
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard: boolean;
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard: boolean;
  /** Автопереход включен */
  enableAutoTransition: boolean;
  /** Цель автоперехода */
  autoTransitionTo: string;
  /** Сбор пользовательского ввода */
  collectUserInput: boolean;
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
