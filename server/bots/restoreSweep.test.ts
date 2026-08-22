/**
 * @fileoverview Тесты выбора кандидатов контрольного прохода restore
 * @module server/bots/restoreSweep.test
 */

import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  selectSweepCandidates,
  SERVER_RESTART_MARKER,
  type SweepInstanceInput,
} from './restoreSweepSelect';
import { RESTORE_SWEEP_DELAY_MS } from './restoreSweepConstants';

function row(partial: Partial<SweepInstanceInput> & { id: number; projectId: number; tokenId: number }): SweepInstanceInput {
  return {
    status: 'stopped',
    errorMessage: null,
    isActive: 1,
    ...partial,
  };
}

describe('RESTORE_SWEEP_DELAY_MS', () => {
  it('одна минута', () => {
    assert.strictEqual(RESTORE_SWEEP_DELAY_MS, 60_000);
  });
});

describe('selectSweepCandidates', () => {
  it('фантомный running берём', () => {
    const instances = [
      row({ id: 1, projectId: 3, tokenId: 7, status: 'running' }),
    ];
    const got = selectSweepCandidates(instances, () => false);
    assert.strictEqual(got.length, 1);
    assert.strictEqual(got[0].tokenId, 7);
  });

  it('реально работающий running не берём', () => {
    const instances = [
      row({ id: 1, projectId: 3, tokenId: 7, status: 'running' }),
    ];
    const got = selectSweepCandidates(instances, () => true);
    assert.strictEqual(got.length, 0);
  });

  it('ручной stop не берём', () => {
    const instances = [
      row({ id: 1, projectId: 3, tokenId: 7, status: 'stopped', errorMessage: null }),
    ];
    const got = selectSweepCandidates(instances, () => false);
    assert.strictEqual(got.length, 0);
  });

  it('isActive=0 не берём', () => {
    const instances = [
      row({
        id: 1,
        projectId: 3,
        tokenId: 7,
        status: 'running',
        isActive: 0,
      }),
    ];
    const got = selectSweepCandidates(instances, () => false);
    assert.strictEqual(got.length, 0);
  });

  it('маркер __server_restart__ берём', () => {
    const instances = [
      row({
        id: 1,
        projectId: 3,
        tokenId: 7,
        status: 'stopped',
        errorMessage: SERVER_RESTART_MARKER,
      }),
    ];
    const got = selectSweepCandidates(instances, () => false);
    assert.strictEqual(got.length, 1);
  });

  it('неудача основного restore (failedTokenIds) берём', () => {
    const instances = [
      row({
        id: 1,
        projectId: 3,
        tokenId: 7,
        status: 'error',
        errorMessage: 'таймаут',
      }),
    ];
    const got = selectSweepCandidates(instances, () => false, new Set([7]));
    assert.strictEqual(got.length, 1);
  });

  it('error без failedTokenIds не берём', () => {
    const instances = [
      row({
        id: 1,
        projectId: 3,
        tokenId: 7,
        status: 'error',
        errorMessage: 'старая ошибка',
      }),
    ];
    const got = selectSweepCandidates(instances, () => false, new Set());
    assert.strictEqual(got.length, 0);
  });
});
