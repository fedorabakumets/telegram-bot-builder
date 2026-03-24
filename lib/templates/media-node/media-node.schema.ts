/**
 * @fileoverview Zod-схема валидации параметров медиа-ноды
 * @module templates/media-node/media-node.schema
 */

import { z } from 'zod';

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
});

/** Тип параметров медиа-ноды (выведен из схемы) */
export type MediaNodeParams = z.infer<typeof mediaNodeParamsSchema>;
