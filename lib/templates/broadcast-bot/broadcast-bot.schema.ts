/**
 * @fileoverview Zod схема для валидации параметров рассылки Bot API
 * @module templates/broadcast-bot/broadcast-bot.schema
 */

import { z } from 'zod';

/** Схема узла сообщения для рассылки */
export const broadcastNodeSchema = z.object({
  // --- Идентификация ---
  /** ID узла */
  id: z.string(),

  // --- Контент ---
  /** Текст сообщения */
  text: z.string().default(''),
  /** Режим форматирования */
  formatMode: z.string().default('none'),

  // --- Медиа ---
  /** URL изображения */
  imageUrl: z.string().default(''),
  /** URL аудио */
  audioUrl: z.string().default(''),
  /** URL видео */
  videoUrl: z.string().default(''),
  /** URL документа */
  documentUrl: z.string().default(''),
  /** Прикреплённые медиафайлы */
  attachedMedia: z.array(z.string()).default([]),

  // --- Автопереход ---
  /** ID узла для автоперехода (FakeCallbackQuery) */
  autoTransitionTo: z.string().default(''),
});

export const broadcastBotParamsSchema = z.object({
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: z.string(),

  // --- Источник ---
  /** Источник ID: 'user_ids', 'bot_users', 'both' */
  idSourceType: z.enum(['user_ids', 'bot_users', 'both']).default('bot_users'),

  // --- Сообщения ---
  /** Сообщение об успехе */
  successMessage: z.string().default(''),
  /** Сообщение об ошибке */
  errorMessage: z.string().default(''),
  /** Список узлов сообщений для рассылки */
  broadcastNodes: z.array(broadcastNodeSchema).default([]),
});

export type BroadcastBotParams = z.infer<typeof broadcastBotParamsSchema>;
