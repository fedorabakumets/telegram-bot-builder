/** @fileoverview Проверки подтверждённого офлайн-состояния локального воркера. */
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { test } from 'node:test';
import { workerManager } from './botWorkerManager';
import type { WorkerChannel } from './workerChannel';
import type { WorkerLaunch } from './workerLaunch';

/** Частные поля, используемые только для подстановки процесса и очистки своих фикстур. */
interface ManagerFixture {
  /**
   * Регистрирует синтетический канал с реальными обработчиками событий менеджера.
   * @param projectId - Зарезервированный тестом идентификатор проекта.
   * @param launch - Выбранный тип запуска.
   * @param channel - Канал процесса.
   * @returns Обещание готовности воркера.
   */
  createWorker(projectId: number, launch: WorkerLaunch, channel: WorkerChannel): Promise<unknown>;
  /** Текущие процессы. */
  workers: Map<number, unknown>;
  /** Последние локальные экземпляры. */
  localWorkerCutoverIncarnations: Map<number, symbol>;
  /** Процессы без подтверждения фактического выхода. */
  unresolvedLocalCutoverIncarnations: Map<number, Set<symbol>>;
  /** Подтверждённые выходы. */
  localWorkerCutoverExits: Set<number>;
}

const manager = workerManager as unknown as ManagerFixture;
const launch: WorkerLaunch = { command: 'тестовый-процесс', args: [], env: {}, projects: null, docker: false, runnerId: null };

/**
 * Регистрирует процесс и направляет ему сообщение готовности.
 * @param projectId - Проект фикстуры.
 * @param pid - Условный PID.
 * @returns Канал зарегистрированного воркера.
 */
async function register(projectId: number, pid: number): Promise<WorkerChannel> {
  const channel = Object.assign(new EventEmitter(), { pid, send: () => true, kill: () => {} });
  const ready = manager.createWorker(projectId, launch, channel);
  channel.emit('line', JSON.stringify({ type: 'system', content: 'worker_ready' }));
  await ready;
  return channel;
}

test('требует выход всех локальных процессов и удерживает офлайн-состояние во время переноса', async context => {
  const projectId = 987693;
  const grouping = process.env.WORKER_GROUPING;
  process.env.WORKER_GROUPING = 'project';
  context.after(() => {
    if (grouping === undefined) delete process.env.WORKER_GROUPING;
    else process.env.WORKER_GROUPING = grouping;
    manager.workers.delete(projectId);
    manager.localWorkerCutoverIncarnations.delete(projectId);
    manager.unresolvedLocalCutoverIncarnations.delete(projectId);
    manager.localWorkerCutoverExits.delete(projectId);
  });

  assert.equal(workerManager.hasTelegramCutoverWorkerExitProof(projectId), false);
  const old = await register(projectId, 11);
  const current = await register(projectId, 12);
  old.emit('exit', 0, null);
  current.emit('error', new Error('Выход не подтверждён'));
  assert.equal(workerManager.hasTelegramCutoverWorkerExitProof(projectId), false);

  const proven = await register(projectId, 13);
  assert.equal(workerManager.hasTelegramCutoverWorkerExitProof(projectId), false);
  proven.emit('exit', 0, null);
  assert.equal(workerManager.hasTelegramCutoverWorkerExitProof(projectId), false);
  current.emit('exit', 0, null);
  assert.equal(workerManager.hasTelegramCutoverWorkerExitProof(projectId), true);

  assert.equal(await workerManager.withOfflineTelegramCutover(projectId, async () => {
    await assert.rejects(workerManager.getOrCreateWorker(projectId), /удерживается переносом/);
    assert.equal(await workerManager.withOfflineTelegramCutover(projectId, async () => true), false);
    return true;
  }), true);
  assert.equal(await workerManager.withOfflineTelegramCutover(projectId, async () => true), true);

  const replacement = await register(projectId, 14);
  assert.equal(workerManager.hasTelegramCutoverWorkerExitProof(projectId), false);
  replacement.emit('exit', 0, null);
});
