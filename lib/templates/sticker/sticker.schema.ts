/**
 * @fileoverview Zod схема для валидации параметров стикера
 * @module templates/sticker/sticker.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров стикера */
export const stickerParamsSchema = z.object({
  nodeId: z.string(),
  stickerUrl: z.string().optional(),
  stickerFileId: z.string().optional(),
  stickerSetName: z.string().optional(),
  mediaCaption: z.string().optional(),
  disableNotification: z.boolean().optional(),
});

/** Тип параметров стикера (выведен из схемы) */
export type StickerParams = z.infer<typeof stickerParamsSchema>;
