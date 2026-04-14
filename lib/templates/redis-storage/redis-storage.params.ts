/**
 * @fileoverview Параметры шаблона redis-storage
 * @module templates/redis-storage/redis-storage.params
 */

/** Параметры для генерации класса RedisStorage */
export interface RedisStorageTemplateParams {
  /** Включён ли Redis (REDIS_URL задан) */
  redisEnabled?: boolean;
}
