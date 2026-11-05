/**
 * @fileoverview Проверка идентификаторов в каналах логов Redis
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { parseLogsChannel } from './redisLogsSubscriber';

describe('Каналы логов Redis', () => {
  it('принимает только положительные целые идентификаторы', () => {
    assert.deepEqual(parseLogsChannel('bot:logs:27:47'), { projectId: 27, tokenId: 47 });
    for (const channel of ['bot:logs:0:47', 'bot:logs:27:0', 'bot:logs:27x:47', 'bot:logs:27:47:extra', 'bot:logs:9007199254740992:47']) {
      assert.equal(parseLogsChannel(channel), null);
    }
  });
});
