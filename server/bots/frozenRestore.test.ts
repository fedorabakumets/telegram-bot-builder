/** @fileoverview Автоматический restore и контрольный проход не оживляют остановленных замороженных ботов. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  all: vi.fn(), token: vi.fn(), instance: vi.fn(), start: vi.fn(), update: vi.fn(), frozen: false,
}));
vi.mock('../storages/storage', () => ({ storage: {
  getAllBotInstances: mocks.all, getBotToken: mocks.token,
  getBotInstanceByToken: mocks.instance, updateBotInstance: mocks.update,
} }));
vi.mock('./botWorkerManager', () => ({ workerManager: { isBotRunning: () => false } }));
vi.mock('./isWorkerPoolEnabled', () => ({ isWorkerPoolEnabled: () => false }));
vi.mock('../utils/findActiveProcessForToken', () => ({ findActiveProcessForToken: () => undefined }));
vi.mock('./frozenBotStatus', () => ({ isBotFrozen: () => mocks.frozen }));
vi.mock('./restoreRetry', () => ({ startBotWithRetries: mocks.start }));
vi.mock('./restoreStartStagger', () => ({ RESTORE_START_STAGGER_MS: 0, waitRestoreStagger: async () => {} }));
import { restoreRunningBots } from './restoreRunningBots';
import { runRestoreSweep } from './restoreSweep';

beforeEach(() => {
  mocks.frozen = false;
  mocks.all.mockReset().mockResolvedValue([{ id: 1, tokenId: 4, projectId: 3, status: 'running',
    desiredStatus: 'running', errorMessage: null }]);
  mocks.token.mockReset().mockResolvedValue({ token: '123:test', isActive: 1 });
  mocks.instance.mockReset().mockResolvedValue({ desiredStatus: 'running' });
  mocks.start.mockReset().mockResolvedValue({ success: true, attempts: 1 });
  mocks.update.mockReset();
});

it('оба фоновых прохода пропускают подтверждённую заморозку без запуска и перезаписи причины', async () => {
  mocks.frozen = true;
  expect((await restoreRunningBots()).restored).toBe(0);
  expect(await runRestoreSweep(new Set([4]))).toBe(0);
  expect(mocks.start).not.toHaveBeenCalled();
  expect(mocks.update).not.toHaveBeenCalled();
});
it('desired stopped исключает даже running со старым маркером рестарта', async () => {
  mocks.all.mockResolvedValue([{ id: 1, tokenId: 4, projectId: 3, status: 'running',
    desiredStatus: 'stopped', errorMessage: '__server_restart__' }]);
  expect((await restoreRunningBots()).total).toBe(0);
  expect(await runRestoreSweep(new Set([4]))).toBe(0);
  expect(mocks.start).not.toHaveBeenCalled();
});
it('повторная проверка перед retry замечает новую заморозку после выбора кандидата', async () => {
  mocks.start.mockImplementation(async (_project, _token, _id, deps) => {
    mocks.frozen = true;
    expect(await deps.canStart()).toBe(false);
    return { success: false, error: 'Запуск отменён остановкой бота', attempts: 0 };
  });
  expect((await restoreRunningBots()).restored).toBe(0);
  expect(mocks.update).not.toHaveBeenCalled();
});
it('обычный бот с разрешённым намерением продолжает восстанавливаться обоими проходами', async () => {
  expect((await restoreRunningBots()).restored).toBe(1);
  expect(await runRestoreSweep()).toBe(1);
  expect(mocks.start).toHaveBeenCalledTimes(2);
});
