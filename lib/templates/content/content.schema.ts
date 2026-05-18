/**
 * @fileoverview Zod-схема валидации параметров шаблона контента
 * @module templates/content/content.schema
 */

import { z } from 'zod';

/** Схема валидации параметров шаблона контента */
export const contentParamsSchema = z.object({
  /** ID проекта */
  projectId: z.number().int().positive(),
  /** Интервал перезагрузки в секундах */
  reloadIntervalSeconds: z.number().int().min(10).default(60),
});
