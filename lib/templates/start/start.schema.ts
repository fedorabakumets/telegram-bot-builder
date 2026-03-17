/**
 * @fileoverview Zod схема для валидации параметров обработчика /start
 * @module templates/start/start.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика /start */
export const startParamsSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  nodeId: z.string(),

  // --- Контент ---
  /** Текст сообщения */
  messageText: z.string().optional(),
  /** Режим форматирования */
  formatMode: z.enum(['html', 'markdown', 'none']).optional(),

  // --- Доступ ---
  /** Только приватные чаты */
  isPrivateOnly: z.boolean().optional(),
  /** Только администраторы */
  adminOnly: z.boolean().optional(),
  /** Требуется авторизация */
  requiresAuth: z.boolean().optional(),
  /** База данных пользователей включена */
  userDatabaseEnabled: z.boolean().optional(),

  // --- Клавиатура ---
  /** Тип клавиатуры */
  keyboardType: z.enum(['inline', 'reply', 'none']).optional(),
  /** Кнопки */
  buttons: z.array(z.object({
    text: z.string(),
    action: z.string(),
    target: z.string(),
    id: z.string(),
  })).optional(),
  /** Клавиатура скрывается после использования */
  oneTimeKeyboard: z.boolean().optional(),
  /** Изменить размер клавиатуры под кнопки */
  resizeKeyboard: z.boolean().optional(),

  // --- Множественный выбор ---
  /** Разрешить множественный выбор */
  allowMultipleSelection: z.boolean().optional(),
  /** Переменная для хранения выборов */
  multiSelectVariable: z.string().optional(),

  // --- Автопереход ---
  /** Автопереход включён */
  enableAutoTransition: z.boolean().optional(),
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo: z.string().optional(),

  // --- Сбор ввода ---
  /** Сбор пользовательского ввода включён */
  collectUserInput: z.boolean().optional(),

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
  attachedMedia: z.array(z.string()).optional(),

  // --- Синонимы ---
  /** Синонимы команды /start */
  synonyms: z.array(z.string()).optional(),
});

/** Тип параметров обработчика /start (выведен из схемы) */
export type StartParams = z.infer<typeof startParamsSchema>;
