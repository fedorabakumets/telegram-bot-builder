/**
 * @fileoverview Бочка для шаблона redis-storage
 * @module templates/redis-storage
 */

export { generateRedisStorage } from './redis-storage.renderer';
export { redisStorageParamsSchema } from './redis-storage.schema';
export type { RedisStorageTemplateParams } from './redis-storage.params';
export type { RedisStorageParams } from './redis-storage.schema';
export * from './redis-storage.fixture';
