/**
 * @fileoverview Zod схема валидации параметров userbot_inline_query
 * @module templates/userbot-inline-query/userbot-inline-query.schema
 */

import { z } from 'zod';

/** Схема валидации параметров inline-запроса через юзербот */
export const userbotInlineQueryParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Username бота для inline-запроса */
  botUsername: z.string().optional().default(''),
  /** Текст запроса */
  query: z.string().optional().default(''),
  /** Целевой чат для отправки результата */
  targetChat: z.string().optional().default(''),
  /** Отправить в тот же чат (botUsername) */
  sendToSameChat: z.boolean().optional().default(true),
  /** Индекс результата (0 = первый) */
  resultIndex: z.string().optional().default('0'),
  /** Переменная для title результата */
  saveResultTitleTo: z.string().optional(),
  /** Переменная для description результата */
  saveResultDescTo: z.string().optional(),
  /** Переменная для ID отправленного сообщения */
  saveResponseIdTo: z.string().optional(),
  /** ID узла для автоперехода */
  autoTransitionTo: z.string().optional(),
  /** ID проекта */
  projectId: z.number().nullable().optional().default(null),
});

/** Тип параметров (выведен из схемы) */
export type UserbotInlineQueryParams = z.infer<typeof userbotInlineQueryParamsSchema>;
