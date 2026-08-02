/**
 * @fileoverview Тесты ожидания подтверждения start из worker
 * @module server/bots/waitForWorkerBotStart.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { EventEmitter } from 'node:events';
import { waitForWorkerBotStart } from './waitForWorkerBotStart';

describe('waitForWorkerBotStart', () => {
  it('резолвится true при bot-started для нужного token', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 1, 42, 2000);
    setTimeout(() => ee.emit('bot-started', 1, 42), 20);
    assert.strictEqual(await p, true);
  });

  it('игнорирует чужой tokenId', async () => {
    const ee = new EventEmitter();
    const p = waitForWorkerBotStart(ee, 1, 42, 80);
    setTimeout(() => ee.emit('bot-started', 1, 99), 10);
    assert.strictEqual(await p, false);
  });

  it('таймаут → false', async () => {
    const ee = new EventEmitter();
    assert.strictEqual(await waitForWorkerBotStart(ee, 1, 7, 50), false);
  });
});
