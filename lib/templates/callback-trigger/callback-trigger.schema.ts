/**
 * @fileoverview Zod схема для валидации параметров триггеров inline-кнопок
 * @module templates/callback-trigger/callback-trigger.schema
 */

import { z } from 'zod';

/** Схема одной записи триггера inline-кнопки */
export const callbackTriggerEntrySchema = z.object({
  /** ID узла callback_trigger */
  nodeId: z.string().min(1),
  /** Значение callback_data — непустая строка */
  callbackData: z.string().min(1),
  /** Режим совпадения: точное или по префиксу */
  matchType: z.enum(['exact', 'startswith']),
  /** Только для администраторов */
  adminOnly: z.boolean().optional(),
  /** Требуется авторизация */
  requiresAuth: z.boolean().optional(),
  /** ID целевого узла */
  targetNodeId: z.string().min(1),
  /** Тип целевого узла */
  targetNodeType: z.string().min(1),
});

/** Схема параметров шаблона триггеров inline-кнопок */
export const callbackTriggerParamsSchema = z.object({
  /** Массив записей триггеров */
  entries: z.array(callbackTriggerEntrySchema),
});

/** Тип параметров, выведенный из схемы */
export type CallbackTriggerParams = z.infer<typeof callbackTriggerParamsSchema>;
