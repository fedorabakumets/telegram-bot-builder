/**
 * @fileoverview Тесты restoreState
 * @module server/bots/restoreState.test
 */

import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import {
  markRestoreStarted,
  markTokenRestored,
  markRestoreFinished,
  isRestoreInProgress,
  isTokenPendingRestore,
  resetRestoreState,
} from './restoreState';

describe('restoreState', () => {
  beforeEach(() => {
    resetRestoreState();
  });

  it('по умолчанию restore не идёт', () => {
    assert.strictEqual(isRestoreInProgress(), false);
    assert.strictEqual(isTokenPendingRestore(1), false);
  });

  it('markRestoreStarted заполняет pending и включает флаг', () => {
    markRestoreStarted([2, 3, 8]);
    assert.strictEqual(isRestoreInProgress(), true);
    assert.strictEqual(isTokenPendingRestore(2), true);
    assert.strictEqual(isTokenPendingRestore(3), true);
    assert.strictEqual(isTokenPendingRestore(8), true);
    assert.strictEqual(isTokenPendingRestore(1), false);
  });

  it('markTokenRestored снимает токен из pending, флаг restore остаётся', () => {
    markRestoreStarted([2, 3]);
    markTokenRestored(2);
    assert.strictEqual(isRestoreInProgress(), true);
    assert.strictEqual(isTokenPendingRestore(2), false);
    assert.strictEqual(isTokenPendingRestore(3), true);
  });

  it('markRestoreFinished сбрасывает всё', () => {
    markRestoreStarted([2, 3]);
    markTokenRestored(2);
    markRestoreFinished();
    assert.strictEqual(isRestoreInProgress(), false);
    assert.strictEqual(isTokenPendingRestore(2), false);
    assert.strictEqual(isTokenPendingRestore(3), false);
  });

  it('resetRestoreState эквивалентен начальному состоянию', () => {
    markRestoreStarted([7]);
    resetRestoreState();
    assert.strictEqual(isRestoreInProgress(), false);
    assert.strictEqual(isTokenPendingRestore(7), false);
  });
});
