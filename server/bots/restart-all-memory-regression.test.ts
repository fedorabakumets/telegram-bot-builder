/** @fileoverview Отказ по памяти в пакете остаётся конечным исходом и не создаёт цикл запусков. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { RestartAllProgress } from './restart-all-progress';

const mocks = vi.hoisted(() => ({ start: vi.fn(), stop: vi.fn(), instance: vi.fn(), tokens: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: {
  getBotTokensByProject: mocks.tokens, getBotInstanceByToken: mocks.instance,
} }));
vi.mock('./startBotAfterStop', () => ({ startBotAfterStop: mocks.start }));
vi.mock('./stopBot', () => ({ stopBot: mocks.stop }));
vi.mock('./restartTiming', () => ({
  RESTART_ALL_BATCH_COOLDOWN_MS: 0, START_STAGGER_MS: 0, sleepMs: async () => {},
}));
import { isRestartAllRunning, restartAllRunningBots } from './restartAllRunningBots';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.tokens.mockResolvedValue([{ id: 45, token: '111111:qa-secret-a' }, { id: 46, token: '111112:qa-secret-b' }]);
  mocks.instance.mockImplementation(async (id: number) => ({
    id, status: 'running', desiredStatus: 'running', desiredGeneration: 4,
  }));
  mocks.stop.mockResolvedValue({ success: true });
});

it('не повторяет отказ по памяти и завершает пакет с частичным успехом', async () => {
  const memoryError = 'Недостаточно памяти для запуска обработчика';
  mocks.start.mockResolvedValueOnce({ success: false, error: memoryError })
    .mockResolvedValueOnce({ success: true, processId: 'worker_12' });
  const progress: RestartAllProgress[] = [];
  const result = await restartAllRunningBots(120045, { onProgress: value => progress.push(value) });
  expect(mocks.start).toHaveBeenCalledTimes(2);
  expect(result).toMatchObject({ ok: true, restarted: 1, failed: 1,
    results: [{ tokenId: 45, success: false, error: memoryError }, { tokenId: 46, success: true }] });
  expect(progress[progress.length - 1]).toMatchObject({ phase: 'completed', total: 2, completed: 2,
    stopped: 2, attempted: 2, restarted: 1, failed: 1 });
  expect(isRestartAllRunning(120045)).toBe(false);
  expect(JSON.stringify(progress)).not.toContain('qa-secret');
  expect(JSON.stringify(result)).not.toContain('NaN');
});

it('не зацикливает пакет, если все старты отклонены по памяти', async () => {
  mocks.start.mockResolvedValue({ success: false, error: 'Недостаточно памяти для запуска обработчика' });
  const result = await restartAllRunningBots(120046);
  expect(mocks.start).toHaveBeenCalledTimes(2);
  expect(result).toMatchObject({ ok: true, restarted: 0, failed: 2 });
  expect(isRestartAllRunning(120046)).toBe(false);
});
