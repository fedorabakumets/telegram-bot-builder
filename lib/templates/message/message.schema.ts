/**
 * @fileoverview Zod схема для валидации параметров сообщения
 * @module templates/message/message.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров сообщения */
export const messageParamsSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  nodeId: z.string(),

  // --- Контент ---
  /** Текст сообщения */
  messageText: z.string().optional().default(''),
  /** Режим форматирования */
  formatMode: z.string().optional().transform(v => (['html', 'markdown', 'none'].includes(v as string) ? v : 'none') as 'html' | 'markdown' | 'none').default('none'),

  // --- Доступ ---
  /** Только администраторы */
  adminOnly: z.boolean().optional().default(false),
  /** Требуется авторизация */
  requiresAuth: z.boolean().optional().default(false),
  /** База данных пользователей включена */
  userDatabaseEnabled: z.boolean().optional().default(false),

  // --- Клавиатура ---
  /** Тип клавиатуры */
  keyboardType: z.enum(['inline', 'reply', 'none']).optional().default('none'),
  /** Раскладка клавиатуры */
  keyboardLayout: z.any().optional(),
  /** Кнопки */
  buttons: z.array(z.any()).optional().default([]),
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard: z.boolean().optional().default(false),
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard: z.boolean().optional(),

  // --- Множественный выбор ---
  /** Разрешить множественный выбор */
  allowMultipleSelection: z.boolean().optional().default(false),
  /** Переменная для хранения выборов */
  multiSelectVariable: z.string().optional(),

  // --- Автопереход ---
  /** Автопереход включён */
  enableAutoTransition: z.boolean().optional().default(false),
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo: z.string().optional(),

  // --- Сбор ввода ---
  /** Сбор пользовательского ввода включён */
  collectUserInput: z.boolean().optional().default(false),
  /** Включить текстовый ввод */
  enableTextInput: z.boolean().optional().default(false),
  /** Включить ввод фото */
  enablePhotoInput: z.boolean().optional().default(false),
  /** Включить ввод видео */
  enableVideoInput: z.boolean().optional().default(false),
  /** Включить ввод аудио */
  enableAudioInput: z.boolean().optional().default(false),
  /** Включить ввод документов */
  enableDocumentInput: z.boolean().optional().default(false),
  /** Переменная для сохранения ввода */
  inputVariable: z.string().optional(),
  /** Целевой узел после ввода */
  inputTargetNodeId: z.string().optional(),
  /** Минимальная длина ввода */
  minLength: z.number().optional().default(0),
  /** Максимальная длина ввода */
  maxLength: z.number().optional().default(0),
  /** Добавлять к существующей переменной */
  appendVariable: z.boolean().optional().default(false),

  // --- Медиа ---
  /** URL изображения */
  imageUrl: z.string().optional(),
  /** URL документа */
  documentUrl: z.string().optional(),
  /** URL видео */
  videoUrl: z.string().optional(),
  /** URL аудио */
  audioUrl: z.string().optional(),
  /** Прикреплённые медиафайлы */
  attachedMedia: z.array(z.string()).optional().default([]),
  /** Флаг: imageUrl является локальным путём /uploads/ */
  isLocalImageUrl: z.boolean().optional().default(false),
  /** Флаг: videoUrl является локальным путём /uploads/ */
  isLocalVideoUrl: z.boolean().optional().default(false),
  /** Флаг: audioUrl является локальным путём /uploads/ */
  isLocalAudioUrl: z.boolean().optional().default(false),
  /** Флаг: documentUrl является локальным путём /uploads/ */
  isLocalDocumentUrl: z.boolean().optional().default(false),

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages: z.boolean().optional().default(false),
  /** Массив условных сообщений */
  conditionalMessages: z.array(z.any()).optional().default([]),
  /** Запасное сообщение */
  fallbackMessage: z.string().optional(),

  // --- Синонимы ---
  /** Записи синонимов для генерации обработчиков */
  synonymEntries: z.array(z.any()).optional().default([]),

  // --- Служебные ---
  /** Есть ли входящие кнопки с hideAfterClick=true, ведущие к этому узлу */
  hasHideAfterClickIncoming: z.boolean().optional().default(false),
  /** Имя переменной для сохранения ID отправленного сообщения */
  saveMessageIdTo: z.string().optional(),

  /** Список получателей сообщения (chat_id / user / admin_ids) */
  messageSendRecipients: z.array(z.object({
    /** Уникальный ID получателя */
    id: z.string(),
    /** Тип получателя */
    type: z.enum(['user', 'chat_id', 'admin_ids']).default('user'),
    /** Chat ID или переменная */
    chatId: z.string().optional(),
    /** ID топика или переменная */
    threadId: z.string().optional(),
    /** Это группа или канал — добавить -100 к ID */
    isGroup: z.boolean().optional().default(false),
  })).optional().default([]),
  /**
   * Паттерн для декоратора @dp.callback_query.
   * Если задан customCallbackData у кнопки goto/command — используется он.
   * Иначе — nodeId (обратная совместимость).
   */
  callbackPattern: z.string().optional(),

  /** Имя переменной для сохранения ID отправленного сообщения */
  saveMessageIdTo: z.string().optional(),
});

/** Тип параметров сообщения (выведен из схемы) */
export type MessageParams = z.infer<typeof messageParamsSchema>;
