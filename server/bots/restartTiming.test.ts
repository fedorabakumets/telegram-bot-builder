/**
 * @fileoverview Тесты констант пауз рестарта ботов
 * @module server/bots/restartTiming.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  POST_STOP_COOLDOWN_MS,
  POST_STOP_UNCONFIRMED_COOLDOWN_MS,
  RESTART_ALL_BATCH_COOLDOWN_MS,
  START_STAGGER_MS,
  sleepMs,
} from './restartTiming';

describe('restartTiming', () => {
  it('все cooldown ≥ 5с', () => {
    assert.ok(POST_STOP_COOLDOWN_MS >= 5_000);
    assert.ok(POST_STOP_UNCONFIRMED_COOLDOWN_MS >= 5_000);
    assert.ok(RESTART_ALL_BATCH_COOLDOWN_MS >= 5_000);
    assert.ok(START_STAGGER_MS >= 100);
  });

  it('sleepMs резолвится', async () => {
    const t0 = Date.now();
    await sleepMs(30);
    assert.ok(Date.now() - t0 >= 25);
  });
});
