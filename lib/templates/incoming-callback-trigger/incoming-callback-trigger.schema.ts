/**
 * @fileoverview Zod схема для валидации параметров middleware триггера входящего callback_query
 * @module templates/incoming-callback-trigger/incoming-callback-trigger.schema
 */

import { z } from 'zod';

/** Схема одного триггера входящего callback_query */
const incomingCallbackTriggerEntrySchema = z.object({
  /** ID узла incoming_callback_trigger */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
});

/** Схема параметров шаблона middleware триггеров входящих callback_query */
export const incomingCallbackTriggerParamsSchema = z.object({
  /** Массив триггеров входящих callback_query */
  entries: z.array(incomingCallbackTriggerEntrySchema),
});

export type IncomingCallbackTriggerParams = z.infer<typeof incomingCallbackTriggerParamsSchema>;
