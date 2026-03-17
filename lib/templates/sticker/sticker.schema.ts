/**
 * @fileoverview Zod схема для валидации параметров стикера
 * @module templates/sticker/sticker.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров стикера */
export const stickerParamsSchema = z.object({
  // --- Идентификация ---
  /** Уникальный идентификатор узла */
  nodeId: z.string(),

  // --- Медиа ---
  /** URL стикера для отправки */
  stickerUrl: z.string().optional(),
  /** File ID стикера */
  stickerFileId: z.string().optional(),
  /** Название набора стикеров */
  stickerSetName: z.string().optional(),

  // --- Поведение ---
  /** Подпись к стикеру */
  mediaCaption: z.string().optional(),
  /** Отправить без уведомления */
  disableNotification: z.boolean().optional(),
});

/** Тип параметров стикера (выведен из схемы) */
export type StickerParams = z.infer<typeof stickerParamsSchema>;
