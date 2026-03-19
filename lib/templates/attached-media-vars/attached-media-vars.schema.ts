/**
 * @fileoverview Zod схема для валидации параметров шаблона attached-media-vars
 * @module templates/attached-media-vars/attached-media-vars.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров установки переменных из attachedMedia */
export const attachedMediaVarsParamsSchema = z.object({
  /** ID узла */
  nodeId: z.string(),
  /** Массив имён медиа-переменных */
  attachedMedia: z.array(z.string()).default([]),
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
  /** Включить сохранение данных пользователя в БД */
  userDatabaseEnabled: z.boolean().optional(),
});

export type AttachedMediaVarsParams = z.infer<typeof attachedMediaVarsParamsSchema>;
