/**
 * @fileoverview Zod схема валидации параметров userbot_message
 * @module templates/userbot-message/userbot-message.schema
 */

import { z } from 'zod';

/** Схема валидации параметров userbot-сообщения */
export const userbotMessageParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Текст сообщения */
  messageText: z.string().optional().default(''),
  /** Режим форматирования */
  formatMode: z.enum(['html', 'markdown', 'none']).optional().default('html'),
  /** Отключить превью ссылок */
  disableLinkPreview: z.boolean().optional().default(false),
  /** Entity получателя */
  userbotEntity: z.string().optional().default(''),
  /** Прикреплённые медиафайлы */
  attachedMedia: z.array(z.string()).optional().default([]),
  /** Переменная для сохранения ID сообщения */
  saveMessageIdTo: z.string().optional(),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional(),
  /** ID проекта */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров (выведен из схемы) */
export type UserbotMessageParams = z.infer<typeof userbotMessageParamsSchema>;
