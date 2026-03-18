/**
 * @fileoverview Zod схема для валидации параметров обработчика команд
 * @module templates/command/command.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров обработчика команд */
export const commandParamsSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  nodeId: z.string(),
  /** Команда (например, "/help") */
  command: z.string(),

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
    target: z.string().optional().default(''),
    id: z.string(),
    url: z.string().optional(),
    hideAfterClick: z.boolean().optional(),
    requestContact: z.boolean().optional(),
    requestLocation: z.boolean().optional(),
  })).optional(),
  /** Раскладка клавиатуры */
  keyboardLayout: z.object({
    rows: z.array(z.object({ buttonIds: z.array(z.string()) })),
    columns: z.number(),
    autoLayout: z.boolean(),
  }).optional(),

  // --- Условные сообщения ---
  /** Условные сообщения включены */
  enableConditionalMessages: z.boolean().optional(),
  /** Массив условных сообщений */
  conditionalMessages: z.array(z.object({
    condition: z.string(),
    variableName: z.string().optional(),
    priority: z.number().optional(),
    buttons: z.array(z.object({
      text: z.string(),
      action: z.string(),
      target: z.string(),
      id: z.string(),
    })).optional(),
    collectUserInput: z.boolean().optional(),
    inputVariable: z.string().optional(),
    nextNodeAfterInput: z.string().optional(),
    waitForTextInput: z.boolean().optional(),
    enableTextInput: z.boolean().optional(),
  })).optional(),
  /** Запасное сообщение */
  fallbackMessage: z.string().optional(),

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
  /** Синонимы команды */
  synonyms: z.array(z.string()).optional(),
});

/** Тип параметров обработчика команд (выведен из схемы) */
export type CommandParams = z.infer<typeof commandParamsSchema>;
