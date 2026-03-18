/**
 * @fileoverview Zod схема для валидации параметров утилит
 * @module templates/schemas/utils-schema
 */

import { z } from 'zod';

/** Схема для валидации параметров утилит */
export const utilsParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
  adminOnly: z.boolean().default(false),
  isPrivateOnly: z.boolean().default(false),
  requiresAuth: z.boolean().default(false),
});

/** Тип параметров утилит (выведен из схемы) */
export type UtilsParams = z.infer<typeof utilsParamsSchema>;
