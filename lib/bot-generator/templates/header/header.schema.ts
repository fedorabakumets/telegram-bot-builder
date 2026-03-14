/**
 * @fileoverview Zod схема для валидации параметров заголовка
 * @module templates/header/header.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров заголовка */
export const headerParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional().default(false),
  hasInlineButtons: z.boolean().optional().default(false),
  hasMediaNodes: z.boolean().optional().default(false),
});

/** Тип параметров заголовка (выведен из схемы) */
export type HeaderParams = z.infer<typeof headerParamsSchema>;
