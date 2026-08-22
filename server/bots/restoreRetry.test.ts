/**
 * @fileoverview Тесты политики повторов restore
 * @module server/bots/restoreRetry.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  RESTORE_MAX_ATTEMPTS,
  RESTORE_RETRY_DELAYS,
  delayBeforeAttempt,
  startBotWithRetries,
} from './restoreRetry';

describe('restoreRetry — константы', () => {
  it('RESTORE_MAX_ATTEMPTS = 3', () => {
    assert.strictEqual(RESTORE_MAX_ATTEMPTS, 3);
  });

  it('RESTORE_RETRY_DELAYS в разумных пределах', () => {
    assert.strictEqual(RESTORE_RETRY_DELAYS.length, 3);
    assert.ok(RESTORE_RETRY_DELAYS[0] >= 1000);
    assert.ok(RESTORE_RETRY_DELAYS[2] <= 60_000);
    assert.ok(RESTORE_RETRY_DELAYS[0] < RESTORE_RETRY_DELAYS[1]);
    assert.ok(RESTORE_RETRY_DELAYS[1] < RESTORE_RETRY_DELAYS[2]);
  });
});

describe('delayBeforeAttempt', () => {
  it('перед первой попыткой паузы нет', () => {
    assert.strictEqual(delayBeforeAttempt(1), 0);
  });

  it('перед 2-й / 3-й — из RESTORE_RETRY_DELAYS', () => {
    assert.strictEqual(delayBeforeAttempt(2), RESTORE_RETRY_DELAYS[0]);
    assert.strictEqual(delayBeforeAttempt(3), RESTORE_RETRY_DELAYS[1]);
  });
});

describe('startBotWithRetries', () => {
  it('успех со второй попытки', async () => {
    let calls = 0;
    const waits: number[] = [];
    const result = await startBotWithRetries(1, 'tok', 7, {
      waitFn: async (ms) => {
        waits.push(ms);
      },
      clearLockFn: async () => true,
      startBotFn: async () => {
        calls += 1;
        if (calls === 1) return { success: false, error: 'tmp' };
        return { success: true, processId: 'worker_1' };
      },
    });

    assert.strictEqual(result.success, true);
    assert.strictEqual(result.attempts, 2);
    assert.strictEqual(result.processId, 'worker_1');
    assert.strictEqual(calls, 2);
    assert.deepStrictEqual(waits, [RESTORE_RETRY_DELAYS[0]]);
  });

  it('отказ после трёх попыток', async () => {
    let calls = 0;
    const result = await startBotWithRetries(1, 'tok', 7, {
      waitFn: async () => {},
      clearLockFn: async () => true,
      startBotFn: async () => {
        calls += 1;
        return { success: false, error: `fail-${calls}` };
      },
    });

    assert.strictEqual(result.success, false);
    assert.strictEqual(result.attempts, 3);
    assert.strictEqual(calls, 3);
    assert.strictEqual(result.error, 'fail-3');
  });

  it('передаёт reuseGeneratedCode: true в startBot', async () => {
    let receivedOpts: { clearLogs?: boolean; reuseGeneratedCode?: boolean } | undefined;
    await startBotWithRetries(1, 'tok', 7, {
      waitFn: async () => {},
      clearLockFn: async () => true,
      startBotFn: async (_p, _t, _id, opts) => {
        receivedOpts = opts;
        return { success: true, processId: 'worker_1' };
      },
    });

    assert.deepStrictEqual(receivedOpts, {
      clearLogs: false,
      reuseGeneratedCode: true,
    });
  });
});
