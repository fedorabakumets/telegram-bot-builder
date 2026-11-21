/** @fileoverview Проверки параллельного обхода проектов, отмены дублей и паузы повторов памяти. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MemoryRecoveryQueue } from './memoryRecoveryQueue';

/** Дать очереди завершить микрозадачи перед проверкой ожидания. */
const flush = async () => { await Promise.resolve(); await Promise.resolve(); };

test('пять разных проектов пробуются параллельно; шестой получает следующий проход', async () => {
  const queue = new MemoryRecoveryQueue(5_000, () => 0);
  const calls: number[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const waiters = Array.from({ length: 6 }, (_, i) => ({ tokenId: i + 1, projectId: i + 1 }));
  const first = queue.tick(waiters, async item => { calls.push(item.tokenId); await gate; });
  await flush();
  assert.deepEqual(calls, [1, 2, 3, 4, 5]);
  await queue.tick(waiters, async item => { calls.push(item.tokenId); });
  assert.equal(calls.length, 5);
  release(); await first;
  await queue.tick(waiters, async item => { calls.push(item.tokenId); });
  assert.deepEqual(calls, [1, 2, 3, 4, 5, 6]);
});

test('один проект допускает параллельные токены, дублей нет', async () => {
  const queue = new MemoryRecoveryQueue(5_000, () => 0);
  const calls: number[] = [];
  let release!: () => void;
  const first = queue.tick([{ tokenId: 1, projectId: 12 }, { tokenId: 1, projectId: 12 },
    { tokenId: 2, projectId: 12 }, { tokenId: 3, projectId: 13 }], async item => {
    calls.push(item.tokenId);
    if (item.tokenId === 1) await new Promise<void>(resolve => { release = resolve; });
  });
  await flush();
  assert.deepEqual(calls, [1, 3, 2]);
  release(); await first;
  assert.deepEqual(calls, [1, 3, 2]);
});

test('повтор отказа одного токена не раньше пяти секунд, удалённые не сохраняются', async () => {
  let now = 0;
  const queue = new MemoryRecoveryQueue(5_000, () => now);
  const calls: number[] = [];
  const waiters = [{ tokenId: 1, projectId: 12 }, { tokenId: 2, projectId: 12 }];
  const attempt = async (item: { tokenId: number }) => { calls.push(item.tokenId); };
  await queue.tick(waiters, attempt);
  await queue.tick(waiters, attempt);
  assert.deepEqual(calls, [1, 2]);
  now = 5_000;
  await queue.tick([waiters[1]], attempt);
  assert.deepEqual(calls, [1, 2, 2]);
});

test('исключение не мешает другому проекту и освобождает занятый токен', async () => {
  let now = 0;
  const queue = new MemoryRecoveryQueue(5_000, () => now);
  const calls: number[] = [];
  const waiters = [{ tokenId: 1, projectId: 12 }, { tokenId: 2, projectId: 13 }];
  await assert.rejects(queue.tick(waiters, async item => {
    calls.push(item.tokenId); if (item.tokenId === 1) throw new Error('memory_pressure');
  }));
  assert.deepEqual(calls, [1, 2]);
  await queue.tick(waiters, async item => { calls.push(item.tokenId); });
  assert.equal(calls.length, 2);
  now = 5_000;
  await queue.tick(waiters, async item => { calls.push(item.tokenId); });
  assert.equal(calls.length, 4);
});

test('один проект использует пять слотов; шестой токен не голодает после паузы', async () => {
  let now = 0;
  const queue = new MemoryRecoveryQueue(5_000, () => now);
  const waiters = Array.from({ length: 8 }, (_, i) => ({ tokenId: i + 1, projectId: 12 }));
  const calls: number[] = [];
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  const first = queue.tick(waiters, async item => { calls.push(item.tokenId); await gate; });
  await flush();
  assert.deepEqual(calls, [1, 2, 3, 4, 5]);
  await queue.tick(waiters, async item => { calls.push(item.tokenId); });
  assert.equal(calls.length, 5);
  release(); await first;
  now = 5_000;
  await queue.tick(waiters, async item => { calls.push(item.tokenId); });
  assert.deepEqual(calls.slice(5), [6, 7, 8, 1, 2]);
});
