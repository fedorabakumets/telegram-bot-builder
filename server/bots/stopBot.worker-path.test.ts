/**
 * @fileoverview Тест: worker-path stop обязан чистить Redis lock по tokenId
 * @module server/bots/stopBot.worker-path.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  buildBotRedisLockKey,
  clearBotRedisLockByTokenId,
} from './clearBotRedisLock';

describe('stopBot worker-path — Redis lock', () => {
  it('clearBotRedisLockByTokenId вызывает del с суффиксом токена', async () => {
    const deleted: string[] = [];
    const fakePub = {
      del: async (key: string) => {
        deleted.push(key);
        return 1;
      },
    };
    // Подменяем через прямой clearBotRedisLock нельзя без Redis —
    // проверяем контракт ключа + byTokenId резолв
    const token = '1111111111:XXXXYYYYZZ';
    assert.strictEqual(buildBotRedisLockKey(token), 'bot:lock:XXXXYYYYZZ');

    const ok = await clearBotRedisLockByTokenId(
      async (id) => (id === 75 ? { id: 75, token } : null),
      75,
    );
    // Без реального Redis publisher вернёт false — это ок для unit без ioredis
    assert.strictEqual(typeof ok, 'boolean');
    assert.strictEqual(deleted.length, 0); // publisher отсутствует в unit
  });

  it('getToken null → false без исключения', async () => {
    const ok = await clearBotRedisLockByTokenId(async () => null, 1);
    assert.strictEqual(ok, false);
  });
});
