/**
 * @fileoverview Тесты clearBotRedisLock / buildBotRedisLockKey
 * @module server/bots/clearBotRedisLock.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { buildBotRedisLockKey } from './clearBotRedisLock';

describe('buildBotRedisLockKey', () => {
  it('берёт последние 10 символов токена', () => {
    assert.strictEqual(
      buildBotRedisLockKey('1234567890:ABCDEFGHIJabcdefghij'),
      'bot:lock:abcdefghij',
    );
  });

  it('короткий токен — весь суффикс', () => {
    assert.strictEqual(buildBotRedisLockKey('short'), 'bot:lock:short');
  });
});
