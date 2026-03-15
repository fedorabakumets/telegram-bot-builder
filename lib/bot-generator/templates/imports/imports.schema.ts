/**
 * @fileoverview Zod схема для валидации параметров импортов
 * @module templates/imports/imports.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров импортов */
export const importsParamsSchema = z.object({
  userDatabaseEnabled: z.boolean(),
  hasInlineButtons: z.boolean(),
  hasAutoTransitions: z.boolean(),
  hasMediaNodes: z.boolean(),
  hasUploadImages: z.boolean(),
});

/** Тип параметров импортов (выведен из схемы) */
export type ImportsParams = z.infer<typeof importsParamsSchema>;
