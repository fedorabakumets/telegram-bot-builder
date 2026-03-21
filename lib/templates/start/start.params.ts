/**
 * @fileoverview Параметры для шаблона обработчика команды /start
 * @module templates/start/start.params
 */

import type { Button } from '../../bot-generator/types/button-types';
import type { KeyboardLayout } from '../types/keyboard-layout';

/** Тип клавиатуры */
export type KeyboardType = 'inline' | 'reply' | 'none';

/** Режим форматирования */
export type FormatMode = 'html' | 'markdown' | 'none';

/** Параметры для генерации обработчика команды /start.
 *
 * Шаблон генерирует два обработчика:
 * - `@dp.message(CommandStart())` — для команды /start
 * - `@dp.callback_query(lambda c: c.data == "start")` — для кнопок
 *   с `action: "goto"` и `target: "start"` (например, "⬅ Назад в меню")
 */
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
  /** Включить текстовый ввод */
  enableTextInput?: boolean;
  /** Включить ввод фото */
  enablePhotoInput?: boolean;
  /** Переменная для фото */
  photoInputVariable?: string;
  /** Включить ввод видео */
  enableVideoInput?: boolean;
  /** Переменная для видео */
  videoInputVariable?: string;
  /** Включить ввод аудио */
  enableAudioInput?: boolean;
  /** Переменная для аудио */
  audioInputVariable?: string;
  /** Включить ввод документов */
  enableDocumentInput?: boolean;
  /** Переменная для документов */
  documentInputVariable?: string;
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
  /** Тип валидации */
  validationType?: string;
  /** Сообщение при ошибке валидации */
  retryMessage?: string;
  /** Сообщение при успешном сохранении */
  successMessage?: string;
  /** Сохранять в базу данных */
  saveToDatabase?: boolean;

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
  /** Есть ли переменная {user_ids} в тексте */
  hasUserIdsVariable?: boolean;
}
