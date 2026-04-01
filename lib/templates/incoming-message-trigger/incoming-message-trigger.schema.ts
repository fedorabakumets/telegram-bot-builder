/**
 * @fileoverview Zod схема для валидации параметров middleware триггера входящего сообщения
 * @module templates/incoming-message-trigger/incoming-message-trigger.schema
 */

import { z } from 'zod';

/** Схема одного триггера входящего сообщения */
const incomingMessageTriggerEntrySchema = z.object({
  /** ID узла incoming_message_trigger */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
});

/** Схема параметров шаблона middleware триггеров входящих сообщений */
export const incomingMessageTriggerParamsSchema = z.object({
  /** Массив триггеров входящих сообщений */
  entries: z.array(incomingMessageTriggerEntrySchema),
});

export type IncomingMessageTriggerParams = z.infer<typeof incomingMessageTriggerParamsSchema>;
