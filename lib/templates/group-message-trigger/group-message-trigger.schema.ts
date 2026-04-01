/**
 * @fileoverview Zod-схема для шаблона триггера сообщения в топике группы
 * @module templates/group-message-trigger/group-message-trigger.schema
 */

import { z } from 'zod';

/** Источник ID группы */
export const groupChatIdSourceSchema = z.enum(['manual', 'variable']);

/** Схема одного узла group_message_trigger */
const groupMessageTriggerEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя для Python-идентификаторов */
  safeName: z.string().min(1),
  /** Числовой ID группы */
  groupChatId: z.string().default(''),
  /** Источник ID группы */
  groupChatIdSource: groupChatIdSourceSchema.default('manual'),
  /** Имя переменной с ID группы */
  groupChatVariableName: z.string().default(''),
  /** Имя переменной где у пользователей хранится thread_id */
  threadIdVariable: z.string().default('support_thread_id'),
  /** Имя переменной куда положить найденный user_id */
  resolvedUserIdVariable: z.string().default('resolved_user_id'),
  /** ID целевого узла */
  targetNodeId: z.string().min(1),
  /** Тип целевого узла */
  targetNodeType: z.string().default('message'),
});

/** Схема параметров шаблона триггеров сообщений в группе */
export const groupMessageTriggerParamsSchema = z.object({
  /** Массив триггеров */
  entries: z.array(groupMessageTriggerEntrySchema),
});

export type GroupMessageTriggerParams = z.infer<typeof groupMessageTriggerParamsSchema>;
