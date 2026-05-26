/**
 * @fileoverview Zod-схема для валидации параметров узла kick_user
 * @module templates/kick-user/kick-user.schema
 */

import { z } from 'zod';

/** Режим определения ID пользователя */
export const kickUserIdSourceSchema = z.enum(['current_user', 'reply_user', 'custom']);

/** Режим определения ID чата */
export const kickUserChatIdSourceSchema = z.enum(['current_chat', 'custom']);

/** Схема одного узла kick_user */
const kickUserEntrySchema = z.object({
  /** ID узла */
  nodeId: z.string().min(1),
  /** Безопасное имя для Python-функции */
  safeName: z.string().min(1),
  /** ID следующего узла (автопереход) */
  targetNodeId: z.string().default(''),
  /** Тип следующего узла */
  targetNodeType: z.string().default(''),
  /** Источник ID пользователя */
  userIdSource: kickUserIdSourceSchema.default('current_user'),
  /** ID пользователя вручную или {переменная} */
  userIdManual: z.string().default(''),
  /** Источник ID чата */
  chatIdSource: kickUserChatIdSourceSchema.default('current_chat'),
  /** ID чата вручную или {переменная} */
  chatIdManual: z.string().default(''),
  /** Не прерывать сценарий при ошибке */
  ignoreErrors: z.boolean().default(true),
});

/** Схема параметров шаблона kick_user */
export const kickUserParamsSchema = z.object({
  /** Массив узлов kick_user */
  entries: z.array(kickUserEntrySchema),
});

/** Тип параметров шаблона */
export type KickUserParams = z.infer<typeof kickUserParamsSchema>;
