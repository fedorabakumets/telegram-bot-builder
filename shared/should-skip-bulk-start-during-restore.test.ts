/**
 * @fileoverview Тесты shouldSkipBulkStartDuringRestore
 * @module shared/should-skip-bulk-start-during-restore.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { shouldSkipBulkStartDuringRestore } from './should-skip-bulk-start-during-restore';

describe('shouldSkipBulkStartDuringRestore', () => {
  it('пропускает токен, если он в очереди restore', () => {
    assert.strictEqual(shouldSkipBulkStartDuringRestore(true), true);
  });

  it('не пропускает токен вне очереди restore', () => {
    assert.strictEqual(shouldSkipBulkStartDuringRestore(false), false);
  });
});
