/**
 * @fileoverview Zod-схема для шаблона пересылки сообщения
 * @module templates/forward-message/forward-message.schema
 */

import { z } from 'zod';

/** Режим определения исходного сообщения */
export const forwardMessageSourceModeSchema = z.enum(['current_message', 'last_message', 'manual', 'variable']);
/** Режим определения чата назначения */
export const forwardMessageTargetModeSchema = z.enum(['manual', 'variable', 'admin_ids']);

/** Схема одного получателя пересылки */
export const forwardMessageTargetRecipientSchema = z.object({
  /** ID получателя внутри узла */
  id: z.string().min(1),
  /** Способ указания чата назначения */
  targetChatIdSource: forwardMessageTargetModeSchema,
  /** ID или username чата */
  targetChatId: z.string().optional().default(''),
  /** Имя переменной с ID чата */
  targetChatVariableName: z.string().optional().default(''),
  /** Тип получателя: "user" — пользователь, "group" — группа или канал */
  targetChatType: z.enum(['user', 'group']).optional().default('user'),
  /** ID топика (message_thread_id) для форум-групп */
  targetThreadId: z.string().optional().default(''),
});

/** Схема параметров шаблона forward_message */
export const forwardMessageParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя функции */
  safeName: z.string().min(1),
  /** Источник message_id сообщения */
  sourceMessageIdSource: forwardMessageSourceModeSchema.optional().default('current_message'),
  /** Ручной message_id сообщения */
  sourceMessageId: z.string().optional().default(''),
  /** Имя переменной с message_id сообщения */
  sourceMessageVariableName: z.string().optional().default(''),
  /** ID узла-источника */
  sourceMessageNodeId: z.string().optional().default(''),
  /** Список получателей пересылки */
  targetRecipients: z.array(forwardMessageTargetRecipientSchema).optional().default([]),
  /** Отправлять без уведомления */
  disableNotification: z.boolean().optional().default(false),
});

/** Тип параметров шаблона пересылки */
export type ForwardMessageParams = z.infer<typeof forwardMessageParamsSchema>;
