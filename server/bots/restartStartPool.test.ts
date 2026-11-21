/** @fileoverview Проверки предела пяти незавершённых попыток пакетного запуска. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { restartStartPool } from './restartStartPool';

test('не создаёт шестую попытку до освобождения одного из пяти мест', async () => {
  const started: number[] = [];
  const finish = new Map<number, () => void>();
  const pending = restartStartPool([1, 2, 3, 4, 5, 6, 7], async id => {
    started.push(id);
    await new Promise<void>(resolve => finish.set(id, resolve));
  });
  assert.deepEqual(started, [1, 2, 3, 4, 5]);
  finish.get(3)!();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [1, 2, 3, 4, 5, 6]);
  finish.get(1)!();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(started, [1, 2, 3, 4, 5, 6, 7]);
  for (const resolve of finish.values()) resolve();
  await pending;
});

test('пустой пакет не запускает операций', async () => {
  await restartStartPool([], async () => { throw new Error('Не должно вызываться'); });
});
