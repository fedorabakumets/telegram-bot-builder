/**
 * @fileoverview Zod схема для валидации параметров отправки медиафайлов
 * @module templates/attached-media/attached-media.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров отправки медиафайлов */
export const attachedMediaParamsSchema = z.object({
  nodeId: z.string(),
  attachedMedia: z.array(z.string()).default([]),
  formatMode: z.enum(['html', 'markdown', 'none']).optional().default('none'),
  keyboardType: z.enum(['inline', 'reply', 'none']).optional().default('none'),
  handlerContext: z.enum(['message', 'callback']).optional().default('callback'),
});

/** Тип параметров (выведен из схемы) */
export type AttachedMediaParams = z.infer<typeof attachedMediaParamsSchema>;
