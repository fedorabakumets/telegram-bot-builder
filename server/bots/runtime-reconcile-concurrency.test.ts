/** @fileoverview Регрессии параллельной сверки проектов и ожидания всех начатых групп. */
import { beforeEach, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  instances: [7, 8].map(projectId => ({ id: projectId, projectId, tokenId: projectId,
    status: 'stopped', desiredStatus: 'running', desiredGeneration: 1, errorMessage: null })),
  start: vi.fn(),
}));
vi.mock('../storages/storage', () => ({ storage: {
  getAllBotInstances: async () => state.instances,
  getBotInstanceByToken: async (id: number) => state.instances.find(item => item.tokenId === id),
  getBotToken: async () => ({ token: 'test', isActive: 1 }),
} }));
vi.mock('./remoteRunnerHub', () => ({ RemoteRunnerHub: { get: async () => ({ inspect: async () => ({ workers: [] }) }) } }));
vi.mock('./botPlacement', () => ({ getProjectPlacement: () => ({ runnerId: 'runner' }) }));
vi.mock('./resolveRunnerRedisUrl', () => ({ resolveRunnerRedisUrl: () => 'redis://test' }));
vi.mock('./startBot', () => ({ startBot: state.start }));
vi.mock('./stopBot', () => ({ stopBot: vi.fn() }));
vi.mock('./automaticBotStartAllowed', () => ({ automaticBotStartAllowed: async () => true }));
vi.mock('./recoverMemoryWaiters', () => ({ recoverMemoryWaiters: async () => {} }));
vi.mock('./scheduleBotRestart', () => ({ scheduleBotRestart: vi.fn() }));
vi.mock('./claimBuildLinkRetry', () => ({ isBuildLinkExpired: () => false, claimBuildLinkRetry: async () => true }));
import { reconcileBotDesiredState } from './runtime-reconcile';

beforeEach(() => { state.start.mockReset(); });

it('медленный проект не задерживает запуск другого проекта', async () => {
  let release!: () => void;
  state.start.mockImplementation(async (pid: number) => {
    if (pid === 7) await new Promise<void>(resolve => { release = resolve; });
    return { success: true };
  });
  const task = reconcileBotDesiredState();
  await vi.waitFor(() => expect(state.start).toHaveBeenCalledTimes(2));
  release();
  expect((await task).started).toBe(2);
});

it('ошибка проекта не освобождает общий проход до завершения соседнего', async () => {
  let release!: () => void;
  state.start.mockImplementation(async (pid: number) => {
    if (pid === 7) throw new Error('Отказ запуска');
    await new Promise<void>(resolve => { release = resolve; });
    return { success: true };
  });
  const task = reconcileBotDesiredState();
  await vi.waitFor(() => expect(state.start).toHaveBeenCalledTimes(2));
  expect(reconcileBotDesiredState()).toBe(task);
  release();
  expect(await task).toMatchObject({ started: 1, failed: 1 });
});
