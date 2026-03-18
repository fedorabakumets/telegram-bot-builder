/**
 * @fileoverview Zod схема для валидации параметров шаблона media-save-vars
 * @module templates/media-save-vars/media-save-vars.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров сохранения медиа-переменных */
export const mediaSaveVarsParamsSchema = z.object({
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

export type MediaSaveVarsParams = z.infer<typeof mediaSaveVarsParamsSchema>;
