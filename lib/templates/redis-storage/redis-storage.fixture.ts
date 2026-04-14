/**
 * @fileoverview Тестовые данные для шаблона redis-storage
 * @module templates/redis-storage/redis-storage.fixture
 */

import type { RedisStorageTemplateParams } from './redis-storage.params';

/** Валидные параметры: Redis включён */
export const validParamsEnabled: RedisStorageTemplateParams = {
  redisEnabled: true,
};

/** Валидные параметры: Redis выключен */
export const validParamsDisabled: RedisStorageTemplateParams = {
  redisEnabled: false,
};
