/**
 * @fileoverview Интеграционная проверка переподключения API к живому исполнителю.
 * @module server/bots/api-restart-reattach.test
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';

/** Команды, отправленные исполнителю вместо Redis Streams. */
const commands: unknown[] = [];
/** Получатели событий живых воркеров. */
const sinks = new Map<string, { handle: (event: unknown) => void }>();
/** Снимок одного уже работающего бота. */
const instance = { id: 7, projectId: 3, tokenId: 11, status: 'running', errorMessage: null, stoppedAt: null };

vi.mock('../storages/storage', () => ({
  storage: { getAllBotInstances: async () => [instance] },
}));
vi.mock('./remoteRunnerHub', () => ({
  RemoteRunnerHub: {
    get: async () => ({
      inspect: async () => ({ workers: [{ workerKey: 3, instance: 'old-worker', tokenIds: [11], pendingTokenIds: [] }] }),
      register: (id: string, sink: { handle: (event: unknown) => void }) => sinks.set(id, sink),
      unregister: (id: string) => sinks.delete(id),
      send: (command: unknown) => { commands.push(command); return Promise.resolve(); },
    }),
  },
}));
vi.mock('./resolveRunnerRedisUrl', () => ({ resolveRunnerRedisUrl: () => 'redis://test' }));

describe('API после перезапуска', () => {
  /** Сбрасывает только наблюдения между проверками. */
  beforeEach(() => { commands.length = 0; sinks.clear(); });

  /** Подключается к прежнему воркеру без нового spawn и пропускает его восстановление. */
  it('сохраняет работающего бота', async () => {
    const { workerManager } = await import('./botWorkerManager');
    const { restoreRunningBots } = await import('./restoreRunningBots');
    const attached = await workerManager.reattachRemoteWorkers();
    expect(attached).toBe(1);
    expect(workerManager.isBotRunning(3, 11)).toBe(true);
    expect(sinks.has('old-worker')).toBe(true);
    expect((await restoreRunningBots()).total).toBe(0);
    expect(commands).toEqual([]);
  });
});
