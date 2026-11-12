/** @fileoverview Проверка смешанной группы: засыпание временного Python не обнуляет общий Python. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RunnerMemoryTotals } from './runnerMemoryTotals';

test('память двух маршрутов суммируется и последний idle сохраняет общий процесс', () => {
  const totals = new RunnerMemoryTotals();
  const legacy = JSON.stringify({ type: 'system', content: 'memory_kb:1000' });
  totals.observe(legacy, 'legacy');
  assert.equal(JSON.parse(totals.observe('{"type":"system","content":"memory_kb:2000"}', 'polling')).content, 'memory_kb:3000');
  assert.equal(JSON.parse(totals.observe('{"type":"system","content":"memory_kb:0"}', 'polling')).content, 'memory_kb:1000');
  const log = '{"type":"stdout","content":"memory_kb:10000"}';
  assert.equal(totals.observe(log, 'polling'), log);
});
