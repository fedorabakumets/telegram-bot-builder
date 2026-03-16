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
  /** ID узла */
  nodeId: string;
  /** Текст сообщения */
  messageText?: string;
  /** Только приватные чаты */
  isPrivateOnly?: boolean;
  /** Только администраторы */
  adminOnly?: boolean;
  /** Требуется авторизация */
  requiresAuth?: boolean;
  /** База данных пользователей включена */
  userDatabaseEnabled?: boolean;
  /** Множественный выбор разрешён */
  allowMultipleSelection?: boolean;
  /** Переменная для множественного выбора */
  multiSelectVariable?: string;
  /** Кнопки */
  buttons?: Button[];
  /** Тип клавиатуры */
  keyboardType?: KeyboardType;
  /** Раскладка клавиатуры */
  keyboardLayout?: KeyboardLayout;
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard?: boolean;
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard?: boolean;
  /** Автопереход включён */
  enableAutoTransition?: boolean;
  /** Цель автоперехода */
  autoTransitionTo?: string;
  /** Сбор пользовательского ввода */
  collectUserInput?: boolean;
  /** Режим форматирования */
  formatMode?: FormatMode;
  /** URL изображения */
  imageUrl?: string;
  /** URL документа */
  documentUrl?: string;
  /** URL видео */
  videoUrl?: string;
  /** URL аудио */
  audioUrl?: string;
  /** Прикреплённые медиа */
  attachedMedia?: string[];
  /** Условные сообщения включены */
  enableConditionalMessages?: boolean;
  /** Условные сообщения */
  conditionalMessages?: any[];
  /** Запасное сообщение */
  fallbackMessage?: string;
  // Поля для сбора пользовательского ввода
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
  /** Целевой узел для ввода */
  inputTargetNodeId?: string;
  /** Минимальная длина ввода */
  minLength?: number;
  /** Максимальная длина ввода */
  maxLength?: number;
  /** Добавлять к существующей переменной */
  appendVariable?: boolean;
}
