/**
 * @fileoverview Тесты stagger-паузы при restore
 * @module server/bots/restoreStartStagger.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  RESTORE_START_STAGGER_MS,
  waitRestoreStagger,
} from './restoreStartStagger';

describe('restoreStartStagger', () => {
  it('RESTORE_START_STAGGER_MS в разумных пределах', () => {
    assert.ok(RESTORE_START_STAGGER_MS >= 100);
    assert.ok(RESTORE_START_STAGGER_MS <= 1000);
  });

  it('waitRestoreStagger ждёт указанное время', async () => {
    const t0 = Date.now();
    await waitRestoreStagger(40);
    assert.ok(Date.now() - t0 >= 35);
  });
});
