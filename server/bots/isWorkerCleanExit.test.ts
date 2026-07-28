/**
 * @fileoverview Тесты классификации clean exit из worker
 * @module server/bots/isWorkerCleanExit.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { isWorkerCleanExit } from './isWorkerCleanExit';

describe('isWorkerCleanExit', () => {
  it('stopped / 0 / null — clean', () => {
    assert.strictEqual(isWorkerCleanExit('stopped'), true);
    assert.strictEqual(isWorkerCleanExit('0'), true);
    assert.strictEqual(isWorkerCleanExit(0), true);
    assert.strictEqual(isWorkerCleanExit('null'), true);
  });

  it('running — clean (legacy CancelledError swallow)', () => {
    assert.strictEqual(isWorkerCleanExit('running'), true);
  });

  it('error и неизвестные — не clean', () => {
    assert.strictEqual(isWorkerCleanExit('error'), false);
    assert.strictEqual(isWorkerCleanExit(1), false);
    assert.strictEqual(isWorkerCleanExit('crash'), false);
  });
});
