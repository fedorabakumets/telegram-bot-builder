/** @fileoverview Проверки ограниченного и объединённого опроса удалённого исполнителя. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WorkerInspectionCache } from './worker-inspection-cache';

test('одновременные запросы используют один inspect и короткий кеш', async () => {
  const cache = new WorkerInspectionCache<{ memory: number }>();
  let calls = 0;
  /** Имитирует один фактический снимок. */
  const inspect = async () => { calls++; return { memory: 0 }; };
  const results = await Promise.all([cache.read('a', inspect), cache.read('a', inspect)]);
  assert.deepEqual(results, [{ memory: 0 }, { memory: 0 }]);
  assert.equal(calls, 1);
  await cache.read('a', inspect);
  assert.equal(calls, 1);
  await cache.read('b', inspect);
  assert.equal(calls, 2);
});

test('недоступный исполнитель возвращает неизвестное значение без текста ошибки', async () => {
  const cache = new WorkerInspectionCache<{}>();
  assert.equal(await cache.read('failed', async () => { throw new Error('secret'); }), null);
  assert.equal(await cache.read('stuck', () => new Promise(() => {}), 10), null);
});
