/**
 * @fileoverview Тесты expectedStops
 * @module server/bots/expectedStops.test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  markExpectedStop,
  clearExpectedStop,
  isExpectedStop,
  clearAllExpectedStops,
} from './expectedStops';

describe('expectedStops', () => {
  beforeEach(() => {
    clearAllExpectedStops();
  });

  it('по умолчанию стоп не ожидаем', () => {
    assert.strictEqual(isExpectedStop(7), false);
  });

  it('mark / clear', () => {
    markExpectedStop(7);
    assert.strictEqual(isExpectedStop(7), true);
    assert.strictEqual(isExpectedStop(8), false);
    clearExpectedStop(7);
    assert.strictEqual(isExpectedStop(7), false);
  });
});
