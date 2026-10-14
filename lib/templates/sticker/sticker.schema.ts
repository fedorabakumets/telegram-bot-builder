/**
 * @fileoverview Zod схема для валидации параметров стикера
 * @module templates/sticker/sticker.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров шага стикера */
export const stickerParamsSchema = z.object({
  /** Уникальный идентификатор узла */
  nodeId: z.string(),

  /** URL стикера (HTTP или путь /uploads/) */
  stickerUrl: z.string().optional(),
  /** File ID стикера */
  stickerFileId: z.string().optional(),
  /** Запасной идентификатор стикера из набора */
  stickerSetName: z.string().optional(),

  /** Подпись из старых данных; в send_sticker не передаётся */
  mediaCaption: z.string().optional(),
  /** Отправить без уведомления */
  disableNotification: z.boolean().optional(),
  /** ID следующего узла автоперехода */
  autoTransitionTo: z.string().optional(),
  /** stickerUrl — локальный путь /uploads/ */
  isLocalStickerUrl: z.boolean().optional(),
});

/** Тип параметров стикера (выведен из схемы) */
export type StickerParams = z.infer<typeof stickerParamsSchema>;
