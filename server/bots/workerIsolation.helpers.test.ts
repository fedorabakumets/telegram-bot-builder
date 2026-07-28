/**
 * @fileoverview Тесты parseWorkerSystemMessage и selectLatestLaunchLogs
 * @module server/bots/workerIsolation.helpers.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseWorkerSystemMessage } from './parseWorkerSystemMessage';
import {
  resolveLaunchIdsForLogs,
  mergeLogsByTimestampAsc,
} from './selectLatestLaunchLogs';

describe('parseWorkerSystemMessage', () => {
  it('парсит bot_started', () => {
    const ev = parseWorkerSystemMessage('bot_started:75');
    assert.strictEqual(ev.kind, 'bot_started');
    assert.strictEqual(ev.tokenId, 75);
  });

  it('парсит bot_exited со статусом', () => {
    const ev = parseWorkerSystemMessage('bot_exited:2:error');
    assert.strictEqual(ev.kind, 'bot_exited');
    assert.strictEqual(ev.tokenId, 2);
    assert.strictEqual(ev.status, 'error');
  });

  it('парсит bot_stopped', () => {
    const ev = parseWorkerSystemMessage('bot_stopped:10');
    assert.strictEqual(ev.kind, 'bot_stopped');
    assert.strictEqual(ev.tokenId, 10);
  });

  it('other для неизвестных', () => {
    assert.strictEqual(parseWorkerSystemMessage('worker_ready').kind, 'other');
  });
});

describe('resolveLaunchIdsForLogs', () => {
  it('без history — только null', () => {
    assert.deepStrictEqual(resolveLaunchIdsForLogs(null), [null]);
  });

  it('stopped — только id', () => {
    assert.deepStrictEqual(resolveLaunchIdsForLogs({ id: 100, status: 'stopped' }), [100]);
  });

  it('running — id + null live', () => {
    assert.deepStrictEqual(resolveLaunchIdsForLogs({ id: 200, status: 'running' }), [200, null]);
  });
});

describe('mergeLogsByTimestampAsc', () => {
  it('сливает и обрезает с конца', () => {
    const a = [
      { timestamp: '2026-01-01T00:00:01Z', id: 1 },
      { timestamp: '2026-01-01T00:00:03Z', id: 3 },
    ];
    const b = [{ timestamp: '2026-01-01T00:00:02Z', id: 2 }];
    const m = mergeLogsByTimestampAsc(a, b, 2);
    assert.strictEqual(m.length, 2);
    assert.strictEqual(m[0].id, 2);
    assert.strictEqual(m[1].id, 3);
  });
});
