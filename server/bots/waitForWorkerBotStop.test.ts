/**
 * @fileoverview Тесты ожидания подтверждения stop из worker
 * @module server/bots/waitForWorkerBotStop.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { waitForWorkerBotStop } from './waitForWorkerBotStop';

describe('waitForWorkerBotStop', () => {
  it('резолвится true при bot-exited для нужного token', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStop(ee, 1, 42, 2000);
    setTimeout(() => ee.emit('bot-exited', 1, 42, 'stopped'), 20);
    assert.strictEqual(await p, true);
  });

  it('игнорирует чужой tokenId', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStop(ee, 1, 42, 80);
    setTimeout(() => ee.emit('bot-exited', 1, 99, 'stopped'), 10);
    assert.strictEqual(await p, false);
  });

  it('таймаут → false', async () => {
    const ee = new EventEmitter();
    assert.strictEqual(await waitForWorkerBotStop(ee, 1, 7, 50), false);
  });
});
