/**
 * @fileoverview Zod схема для валидации параметров шаблона redis-storage
 * @module templates/redis-storage/redis-storage.schema
 */

import { z } from 'zod';

/** Схема для валидации параметров RedisStorage */
export const redisStorageParamsSchema = z.object({
  /** Включён ли Redis (REDIS_URL задан) */
  redisEnabled: z.boolean().default(false),
});

export type RedisStorageParams = z.infer<typeof redisStorageParamsSchema>;
