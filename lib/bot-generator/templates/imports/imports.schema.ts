/**
 * @fileoverview Zod схема для валидации параметров импортов
 * @module templates/imports/imports.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров импортов */
export const importsParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
  hasInlineButtons: z.boolean().default(false),
  hasAutoTransitions: z.boolean().default(false),
  hasMediaNodes: z.boolean().default(false),
  hasUploadImages: z.boolean().default(false),
});

/** Тип параметров импортов (выведен из схемы) */
export type ImportsParams = z.infer<typeof importsParamsSchema>;
