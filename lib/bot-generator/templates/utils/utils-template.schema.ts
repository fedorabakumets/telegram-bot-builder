/**
 * @fileoverview Zod схема для валидации параметров утилит
 * @module templates/utils/utils-template.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров утилит */
export const utilsParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().default(false),
});

/** Тип параметров утилит (выведен из схемы) */
export type UtilsParams = z.infer<typeof utilsParamsSchema>;
