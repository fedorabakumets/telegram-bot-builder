/**
 * @fileoverview Zod схема для валидации параметров триггеров исходящих сообщений
 * @module templates/outgoing-message-trigger/outgoing-message-trigger.schema
 */

import { z } from 'zod';

/** Схема одного триггера исходящего сообщения */
const outgoingMessageTriggerEntrySchema = z.object({
  /** ID узла outgoing_message_trigger */
  nodeId: z.string(),
  /** ID целевого узла */
  targetNodeId: z.string(),
  /** Тип целевого узла */
  targetNodeType: z.string(),
});

/** Схема параметров шаблона триггеров исходящих сообщений */
export const outgoingMessageTriggerParamsSchema = z.object({
  /** Массив триггеров исходящих сообщений */
  entries: z.array(outgoingMessageTriggerEntrySchema),
});

export type OutgoingMessageTriggerParams = z.infer<typeof outgoingMessageTriggerParamsSchema>;
