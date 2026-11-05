/** @fileoverview Проверка сохранения состояния бота при неподтверждённой остановке. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { workerManager } from './botWorkerManager';

test('несовпадение проекта не отправляет команду чужому боту', async (t) => {
  const manager = workerManager as any;
  const projectId = 987680;
  const tokenId = 987681;
  const key = manager.keyOf(projectId);
  manager.workers.set(key, { activeBots: new Set([tokenId]), status: 'ready' });
  manager.tokenProjects.set(tokenId, projectId + 1);
  const send = t.mock.method(manager, 'sendCommand', () => true);
  try {
    assert.equal(await manager.stopBot(projectId, tokenId), false);
    assert.equal(send.mock.callCount(), 0);
    assert.equal(manager.tokenProjects.get(tokenId), projectId + 1);
  } finally {
    manager.workers.delete(key);
    manager.tokenProjects.delete(tokenId);
  }
});

test('неотправленная команда не подтверждает остановку и сохраняет состояние', async (t) => {
  const manager = workerManager as any;
  const projectId = 987670;
  const tokenId = 987671;
  const key = manager.keyOf(projectId);
  const worker = { activeBots: new Set([tokenId]), status: 'starting' };
  const args = { projectId, tokenId, botFile: 'test.py' };
  manager.workers.set(key, worker);
  manager.startArgs.set(tokenId, args);
  t.mock.method(manager, 'sendCommand', () => false);
  const count = manager.listenerCount('bot-exited');
  try {
    assert.equal(await manager.stopBot(projectId, tokenId), false);
    assert.equal(manager.listenerCount('bot-exited'), count);
    assert.equal(worker.activeBots.has(tokenId), true);
    assert.equal(manager.startArgs.get(tokenId), args);
  } finally {
    manager.workers.delete(key);
    manager.startArgs.delete(tokenId);
    manager.tokenProjects.delete(tokenId);
  }
});

test('ответ общего воркера об отсутствии бота направляется его проекту', async (t) => {
  const manager = workerManager as any;
  const projectId = 987660;
  const tokenId = 987661;
  const workerKey = 987662;
  const worker = { activeBots: new Set([987663]), status: 'ready' };
  manager.projectWorkerKeys.set(projectId, workerKey);
  manager.workers.set(workerKey, worker);
  t.mock.method(manager, 'sendCommand', () => {
    manager.handleSystemMessage(workerKey, `bot_stopped:${tokenId}`);
    return true;
  });
  try {
    assert.equal(await manager.stopBot(projectId, tokenId), true);
    assert.equal(worker.activeBots.has(987663), true);
    assert.equal(manager.tokenProjects.has(tokenId), false);
  } finally {
    manager.workers.delete(workerKey);
    manager.projectWorkerKeys.delete(projectId);
    manager.tokenProjects.delete(tokenId);
  }
});

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
