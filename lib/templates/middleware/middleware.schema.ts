/**
 * @fileoverview Zod схема для валидации параметров middleware
 * @module templates/middleware/middleware.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров middleware */
export const middlewareParamsSchema = z.object({
  userDatabaseEnabled: z.boolean().optional().default(false),
});

/** Тип параметров middleware (выведен из схемы) */
export type MiddlewareParams = z.infer<typeof middlewareParamsSchema>;
