/** @fileoverview Проверка сохранения состояния бота при неподтверждённой остановке. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerManager } from './botWorkerManager';

test('таймаут оставляет бота активным и сохраняет параметры запуска', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const manager = workerManager as any;
  const projectId = 987654;
  const tokenId = 987655;
  const args = { projectId, tokenId, botFile: 'test.py' };
  const worker = { activeBots: new Set([tokenId]), status: 'ready' };
  const key = manager.keyOf(projectId);
  manager.workers.set(key, worker);
  manager.startArgs.set(tokenId, args);
  const send = t.mock.method(manager, 'sendCommand', () => true);
  try {
    const result = manager.stopBot(projectId, tokenId);
    await new Promise<void>((resolve) => setImmediate(resolve));
    t.mock.timers.tick(20_000);
    assert.equal(await result, false);
    assert.equal(send.mock.callCount(), 1);
    assert.equal(worker.activeBots.has(tokenId), true);
    assert.equal(manager.startArgs.get(tokenId), args);
  } finally {
    manager.workers.delete(key);
    manager.startArgs.delete(tokenId);
  }
});

test('таймаут запуска и остановки не удаляет возможный активный процесс', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const manager = workerManager as any;
  const worker = { activeBots: new Set([55]), status: 'ready' };
  t.mock.method(manager, 'mountProjectWorker', async () => worker);
  t.mock.method(manager, 'sendStartBot', () => Promise.resolve(false));
  t.mock.method(manager, 'sendCommand', () => true);
  const drain = t.mock.method(manager, 'scheduleWorkerDrain', () => {});
  const result = manager.launchBotOnWorker(44, 44, 'token', 55, 'test.py', {});
  const rejected = assert.rejects(result, /Таймаут bot_started/);
  await new Promise<void>((resolve) => setImmediate(resolve));
  t.mock.timers.tick(20_000);
  await rejected;
  assert.equal(worker.activeBots.has(55), true);
  assert.equal(drain.mock.callCount(), 0);
  manager.startArgs.delete(55);
});
