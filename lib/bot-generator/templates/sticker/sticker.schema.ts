/**
 * @fileoverview Zod схема для валидации параметров стикера
 * @module templates/sticker/sticker.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров стикера */
export const stickerParamsSchema = z.object({
  nodeId: z.string(),
  stickerUrl: z.string().default(''),
  stickerFileId: z.string().default(''),
  stickerSetName: z.string().default(''),
  mediaCaption: z.string().default(''),
  disableNotification: z.boolean(),
});

/** Тип параметров стикера (выведен из схемы) */
export type StickerParams = z.infer<typeof stickerParamsSchema>;
