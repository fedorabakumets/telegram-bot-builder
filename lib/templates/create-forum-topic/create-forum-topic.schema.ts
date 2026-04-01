/**
 * @fileoverview Zod-схема для шаблона create-forum-topic — создание топика в форуме Telegram.
 * @module templates/create-forum-topic/create-forum-topic.schema
 */

import { z } from 'zod';

/** Схема источника ID форум-группы */
export const forumChatIdSourceSchema = z.enum(['manual', 'variable']);

/** Схема параметров шаблона create_forum_topic */
export const createForumTopicParamsSchema = z.object({
  /** Уникальный идентификатор узла */
  nodeId: z.string().min(1),
  /** Безопасное имя функции (без спецсимволов) */
  safeName: z.string().min(1),
  /** Источник ID форум-группы */
  forumChatIdSource: forumChatIdSourceSchema.optional().default('manual'),
  /** ID или username форум-группы */
  forumChatId: z.string().optional().default(''),
  /** Имя переменной с ID форум-группы */
  forumChatVariableName: z.string().optional().default(''),
  /** Название создаваемого топика */
  topicName: z.string().optional().default(''),
  /** Цвет иконки топика */
  topicIconColor: z.string().optional().default('7322096'),
  /** Имя переменной для сохранения thread_id */
  saveThreadIdTo: z.string().optional().default(''),
  /** Не создавать топик повторно, если переменная уже заполнена */
  skipIfExists: z.boolean().optional().default(false),
});

/** Тип параметров шаблона create_forum_topic */
export type CreateForumTopicParams = z.infer<typeof createForumTopicParamsSchema>;
