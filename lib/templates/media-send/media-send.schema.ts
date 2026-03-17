/**
 * @fileoverview Zod схема для валидации параметров шаблона media-send
 * @module templates/media-send/media-send.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров отправки медиафайлов */
export const mediaSendParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** URL изображения */
  imageUrl: z.string().optional(),
  /** URL видео */
  videoUrl: z.string().optional(),
  /** URL аудио */
  audioUrl: z.string().optional(),
  /** URL документа */
  documentUrl: z.string().optional(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type MediaSendParams = z.infer<typeof mediaSendParamsSchema>;
