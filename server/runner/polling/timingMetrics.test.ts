/** @fileoverview Адресная проверка ограниченного окна безопасных задержек исполнителя. */
import assert from 'node:assert/strict';
import test from 'node:test';
import { observePollingTiming, pollingTimingMetrics } from './timingMetrics';
test('замеры ограничены окном и не сохраняют другие поля события', () => {
  const now = 10_000_000;
  for (let index = 0; index < 130; index++) observePollingTiming('child_ready', { startupMs: index }, now);
  observePollingTiming('handled', { receiveToHandledMs: 37, updateId: 999 }, now);
  observePollingTiming('child_ready', { startupMs: Infinity }, now);
  observePollingTiming('child_ready', { startupMs: -1 }, now);
  const metrics = pollingTimingMetrics(now);
  assert.equal(metrics.startupMs?.count, 120);
  assert.equal(metrics.startupMs?.lastMs, 129);
  assert.equal(metrics.startupMs?.p95Ms, 123);
  assert.equal(metrics.handlingMs?.lastMs, 37);
  assert.equal(JSON.stringify(metrics).includes('updateId'), false);
  assert.deepEqual(pollingTimingMetrics(now + 900_001), { startupMs: null, handlingMs: null });
});
