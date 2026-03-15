/**
 * @fileoverview Zod схема для валидации параметров заголовка
 * @module templates/header/header.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров заголовка */
export const headerParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional(),
  hasInlineButtons: z.boolean().optional(),
  hasMediaNodes: z.boolean().optional(),
});

/** Тип параметров заголовка (выведен из схемы) */
export type HeaderParams = z.infer<typeof headerParamsSchema>;
