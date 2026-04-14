/**
 * @fileoverview Renderer для шаблона redis-storage
 * @module templates/redis-storage/redis-storage.renderer
 */

import type { RedisStorageTemplateParams } from './redis-storage.params';
import { renderPartialTemplate } from '../template-renderer';

/**
 * Генерирует Python-код класса RedisStorage.
 * Рендерит шаблон redis-storage/redis-storage.py.jinja2.
 *
 * @param params - Параметры генерации
 * @returns Сгенерированный Python-код класса RedisStorage
 */
export function generateRedisStorage(params: RedisStorageTemplateParams): string {
  return renderPartialTemplate('redis-storage/redis-storage.py.jinja2', {
    redisEnabled: params.redisEnabled ?? false,
  });
}
