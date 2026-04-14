/**
 * @fileoverview Тесты для шаблона redis-storage
 * @module templates/redis-storage/redis-storage.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { generateRedisStorage } from './redis-storage.renderer';
import { validParamsEnabled, validParamsDisabled } from './redis-storage.fixture';
import { redisStorageParamsSchema } from './redis-storage.schema';

describe('generateRedisStorage()', () => {
  it('class RedisStorage(BaseStorage) присутствует в выводе', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('class RedisStorage(BaseStorage)'));
  });

  it('async def set_state присутствует', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('async def set_state'));
  });

  it('async def get_state присутствует', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('async def get_state'));
  });

  it('async def set_data присутствует', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('async def set_data'));
  });

  it('async def get_data присутствует', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('async def get_data'));
  });

  it('async def close присутствует', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('async def close'));
  });

  it('fsm:state:{uid} — ключ Redis для состояния', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('fsm:state:{uid}'));
  });

  it('fsm:data:{uid} — ключ Redis для данных', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('fsm:data:{uid}'));
  });

  it('setex — используется TTL', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('setex'));
  });

  it('86400 — TTL 24 часа', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('86400'));
  });

  it('user_data[uid]["__fsm_state__"] — синхронизация с user_data', () => {
    const result = generateRedisStorage(validParamsEnabled);
    assert.ok(result.includes('user_data[uid]["__fsm_state__"]'));
  });

  it('работает с redisEnabled=false', () => {
    const result = generateRedisStorage(validParamsDisabled);
    assert.ok(typeof result === 'string');
    assert.ok(result.includes('class RedisStorage(BaseStorage)'));
  });
});

describe('redisStorageParamsSchema', () => {
  it('принимает валидные параметры', () => {
    assert.ok(redisStorageParamsSchema.safeParse(validParamsEnabled).success);
    assert.ok(redisStorageParamsSchema.safeParse(validParamsDisabled).success);
  });

  it('применяет default false для redisEnabled', () => {
    const result = redisStorageParamsSchema.safeParse({});
    assert.ok(result.success);
    assert.strictEqual(result.data?.redisEnabled, false);
  });

  it('отклоняет строку вместо boolean', () => {
    assert.ok(!redisStorageParamsSchema.safeParse({ redisEnabled: 'true' }).success);
  });
});

describe('Производительность', () => {
  it('generateRedisStorage: быстрее 10ms', () => {
    const start = Date.now();
    generateRedisStorage(validParamsEnabled);
    assert.ok(Date.now() - start < 10);
  });
});
