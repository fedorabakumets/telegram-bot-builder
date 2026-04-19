/**
 * @fileoverview Регресс-тест для игнорирования логовых Redis-каналов platform-subscriber'ом
 * @module tests/test-phase-redis-platform-subscriber
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import fs from 'node:fs';

/**
 * Читает исходный код Redis platform subscriber.
 * @returns Текст файла subscriber'а
 */
function readPlatformSubscriber(): string {
  return fs.readFileSync('server/redis/redisPlatformSubscriber.ts', 'utf-8');
}

describe('Фаза: redis platform subscriber', () => {
  it('игнорирует bot:logs каналы без warning', () => {
    const code = readPlatformSubscriber();

    assert.ok(code.includes("channel.startsWith('bot:logs:')"));
    assert.match(
      code,
      /if\s*\(isLogsChannel\(channel\)\)\s*\{\s*return;\s*\}/s,
    );
  });
});
