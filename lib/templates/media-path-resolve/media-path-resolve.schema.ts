/**
 * @fileoverview Zod схема для валидации параметров шаблона media-path-resolve
 * @module templates/media-path-resolve/media-path-resolve.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров резолвинга пути к медиафайлу */
export const mediaPathResolveParamsSchema = z.object({
  /** Тип медиа */
  mediaType: z.enum(['photo', 'video', 'audio', 'document']),
  /** Имя переменной с URL */
  urlVar: z.string(),
  /** Уровень отступа */
  indentLevel: z.string().optional(),
});

export type MediaPathResolveParams = z.infer<typeof mediaPathResolveParamsSchema>;
