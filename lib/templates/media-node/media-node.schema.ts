/**
 * @fileoverview Zod-схема валидации параметров медиа-ноды
 * @module templates/media-node/media-node.schema
 */

import { z } from 'zod';

/** Схема одного получателя медиа-сообщения */
const mediaSendRecipientSchema = z.object({
  /** Уникальный идентификатор получателя */
  id: z.string(),
  /** Тип получателя */
  type: z.enum(['user', 'chat_id', 'admin_ids']).default('user'),
  /** ID чата или канала */
  chatId: z.string().optional(),
  /** ID топика в группе */
  threadId: z.string().optional(),
  /** Добавить префикс -100 для групп/каналов */
  isGroup: z.boolean().optional().default(false),
});

/** Схема для валидации параметров медиа-ноды */
export const mediaNodeParamsSchema = z.object({
  /** Уникальный идентификатор узла */
  nodeId: z.string(),
  /** Массив URL медиафайлов */
  attachedMedia: z.array(z.string()),
  /** Включить автопереход */
  enableAutoTransition: z.boolean().optional(),
  /** ID целевого узла автоперехода */
  autoTransitionTo: z.string().optional(),
  /** Список получателей (если пустой — отправка пользователю) */
  messageSendRecipients: z.array(mediaSendRecipientSchema).optional().default([]),
});

/** Тип параметров медиа-ноды (выведен из схемы) */
export type MediaNodeParams = z.infer<typeof mediaNodeParamsSchema>;
