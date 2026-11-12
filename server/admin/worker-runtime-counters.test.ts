/** @fileoverview Проверки выборки диагностики без исходных настроек и подмены неизвестных значений. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { RunnerSnapshot } from '../runner/runnerWorkers';
import { selectWorkerRuntimeCounters } from './worker-runtime-counters';

test('отсутствующий исполнитель и старый протокол остаются неизвестными', () => {
  assert.deepEqual(selectWorkerRuntimeCounters(null), { connected: false, workers: [] });
  const snapshot: RunnerSnapshot = { workers: [{ workerKey: 1, instance: 'a', tokenIds: [], pendingTokenIds: [] }] };
  assert.equal(selectWorkerRuntimeCounters(snapshot).workers[0].pythonCounters, null);
});

test('выборка не распространяет окружение и прочие поля снимка', () => {
  const worker = { workerKey: 2, instance: 'b', tokenIds: [42], pendingTokenIds: [], environment: 'SECRET' };
  const result = selectWorkerRuntimeCounters({ workers: [worker] });
  assert.deepEqual(result, { connected: true, workers: [{ workerKey: 2, instance: 'b', pythonCounters: null }] });
  assert.ok(!JSON.stringify(result).includes('SECRET'));
});
