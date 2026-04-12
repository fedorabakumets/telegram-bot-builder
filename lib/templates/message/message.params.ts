/**
 * @fileoverview Параметры для шаблона сообщения
 * @module templates/message/message.params
 */

import type { Button } from '../../bot-generator/types/button-types';
import type { KeyboardLayout } from '../types/keyboard-layout';
import type { DynamicButtonsConfig } from '../keyboard/dynamic-buttons';

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
  /** Включить генерацию динамической inline-клавиатуры */
  enableDynamicButtons?: boolean;
  /** Конфигурация динамической inline-клавиатуры */
  dynamicButtons?: DynamicButtonsConfig;
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
  /** Тип валидации */
  validationType?: string;
  /** Сообщение при ошибке валидации */
  retryMessage?: string;
  /** Сообщение при успешном сохранении */
  successMessage?: string;
  /** Сохранять в базу данных */
  saveToDatabase?: boolean;
  /** Переменная для фото */
  photoInputVariable?: string;
  /** Переменная для видео */
  videoInputVariable?: string;
  /** Переменная для аудио */
  audioInputVariable?: string;
  /** Переменная для документов */
  documentInputVariable?: string;

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
  /** Флаг: imageUrl является локальным путём /uploads/ */
  isLocalImageUrl?: boolean;
  /** Флаг: videoUrl является локальным путём /uploads/ */
  isLocalVideoUrl?: boolean;
  /** Флаг: audioUrl является локальным путём /uploads/ */
  isLocalAudioUrl?: boolean;
  /** Флаг: documentUrl является локальным путём /uploads/ */
  isLocalDocumentUrl?: boolean;

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages?: boolean;
  /** Массив условных сообщений */
  conditionalMessages?: any[];
  /** Запасное сообщение */
  fallbackMessage?: string;

  // --- Синонимы ---
  /** Записи синонимов для генерации обработчиков */
  synonymEntries?: any[];

  // --- Служебные ---
  /** Есть ли входящие кнопки с hideAfterClick=true, ведущие к этому узлу */
  hasHideAfterClickIncoming?: boolean;
  /** Использует ли текст переменные user_ids */
  hasUserIdsVariable?: boolean;
  /**
   * Паттерн для декоратора @dp.callback_query.
   * Если задан customCallbackData у кнопки goto/command, ведущей к этому узлу —
   * используется он. Иначе — nodeId (обратная совместимость).
   */
  callbackPattern?: string;

  /** Имя переменной для сохранения ID отправленного сообщения */
  saveMessageIdTo?: string;

  /** Список получателей сообщения (помимо основного пользователя) */
  messageSendRecipients?: Array<{
    /** Уникальный идентификатор получателя */
    id: string;
    /** Тип получателя: 'user' — основной пользователь, 'chat_id' — конкретный чат, 'admin_ids' — администраторы */
    type: 'user' | 'chat_id' | 'admin_ids';
    /** ID чата, @username или {переменная} */
    chatId?: string;
    /** ID топика или {переменная} */
    threadId?: string;
  }>;
}
