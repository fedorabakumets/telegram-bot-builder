/**
 * @fileoverview Zod схема для валидации параметров обработчиков текстовых триггеров
 * @module templates/text-trigger/text-trigger.schema
 */

import { z } from 'zod';

/** Схема одного текстового триггера */
const textTriggerEntrySchema = z.object({
  /** ID узла text_trigger */
  nodeId: z.string(),
  /** Список текстовых фраз для срабатывания */
  synonyms: z.array(z.string()),
  /** Тип совпадения */
  matchType: z.enum(['exact', 'contains']),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
  /** Только для администраторов */
  adminOnly: z.boolean().optional(),
  /** Требуется авторизация пользователя */
  requiresAuth: z.boolean().optional(),
});

/** Схема параметров шаблона текстовых триггеров */
export const textTriggerParamsSchema = z.object({
  /** Массив текстовых триггеров */
  entries: z.array(textTriggerEntrySchema),
});

export type TextTriggerParams = z.infer<typeof textTriggerParamsSchema>;
