/** @fileoverview Регрессии частичных исходов, прогресса и защиты пакетного перезапуска. */
import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ tokens: vi.fn(), instance: vi.fn(), stop: vi.fn(), start: vi.fn(), sleep: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: {
  getBotTokensByProject: mocks.tokens, getBotInstanceByToken: mocks.instance,
} }));
vi.mock('./stopBot', () => ({ stopBot: mocks.stop }));
vi.mock('./startBotAfterStop', () => ({ startBotAfterStop: mocks.start }));
vi.mock('./restartTiming', () => ({ RESTART_ALL_BATCH_COOLDOWN_MS: 5000, START_STAGGER_MS: 250, sleepMs: mocks.sleep }));

import { restartAllRunningBots, RestartAllInProgressError, isRestartAllRunning } from './restartAllRunningBots';
import type { RestartAllProgress } from './restartAllRunningBots';

beforeEach(() => {
  vi.resetAllMocks();
  mocks.tokens.mockResolvedValue([{ id: 1, token: 'secret-one' }, { id: 2, token: 'secret-two' }]);
  mocks.instance.mockResolvedValue({ status: 'running', desiredStatus: 'running', desiredGeneration: 3 });
  mocks.stop.mockResolvedValue({ success: true });
  mocks.start.mockResolvedValue({ success: true, processId: 'worker' });
  mocks.sleep.mockResolvedValue(undefined);
});

it('показывает этапы и завершённые исходы без секретов и сохраняет порядок', async () => {
  const progress: RestartAllProgress[] = [];
  mocks.start.mockResolvedValueOnce({ success: false, error: 'Ошибка secret-one' });
  const result = await restartAllRunningBots(12, { onProgress: event => progress.push(event) });
  expect(result.restarted).toBe(1);
  expect(result.failed).toBe(1);
  expect(progress.map(p => p.phase)).toEqual(['stopping', 'stopping', 'stopping', 'cooldown', 'starting', 'starting', 'starting', 'completed']);
  expect(progress.at(-1)).toMatchObject({ total: 2, stopped: 2, completed: 2, attempted: 2, restarted: 1, failed: 1 });
  expect(JSON.stringify(progress)).not.toContain('secret-one');
  expect(mocks.stop.mock.invocationCallOrder.at(-1)).toBeLessThan(mocks.start.mock.invocationCallOrder[0]);
  // Пауза проекта 250 мс теперь только в общем startBot limiter, без двойного ожидания пакетом.
  expect(mocks.sleep.mock.calls).toEqual([[5000]]);
});

it('ошибка остановки не мешает остальным и остановленный бот запускается один раз', async () => {
  mocks.stop.mockRejectedValueOnce(new Error('stop failed'));
  const result = await restartAllRunningBots(12);
  expect(result).toMatchObject({ restarted: 1, failed: 1 });
  expect(mocks.start).toHaveBeenCalledTimes(1);
  expect(mocks.start).toHaveBeenCalledWith(12, 'secret-two', 2);
});

it('ошибка допуска запуска превращается в частичный исход, очередь продолжается', async () => {
  mocks.start.mockRejectedValueOnce(new Error('Нет памяти'));
  const result = await restartAllRunningBots(12);
  expect(result).toMatchObject({ restarted: 1, failed: 1 });
  expect(result.results[0].error).toBe('Нет памяти');
  expect(mocks.start).toHaveBeenCalledTimes(2);
});

/** Пакет допускает параллельные попытки и публикует прогресс завершений независимо. */
it('не блокирует второй старт медленным первым, сохраняя порядок итогов и прогресс', async () => {
  let complete!: (value: { success: boolean }) => void;
  mocks.start.mockImplementationOnce(() => new Promise(resolve => { complete = resolve; }));
  const progress: RestartAllProgress[] = [];
  const pending = restartAllRunningBots(12, { onProgress: event => progress.push(event) });
  await vi.waitFor(() => expect(mocks.start).toHaveBeenCalledTimes(2));
  expect(progress.at(-1)).toMatchObject({ phase: 'starting', attempted: 1 });
  complete({ success: true });
  const result = await pending;
  expect(mocks.start).toHaveBeenCalledTimes(2);
  expect(result.results.map(row => row.tokenId)).toEqual([1, 2]);
  expect(progress.at(-1)).toMatchObject({ phase: 'completed', attempted: 2 });
  expect(mocks.sleep.mock.calls).toEqual([[5000]]);
});

it('блокирует наложение пакетов и освобождает проект после ошибки подготовки', async () => {
  let release!: () => void;
  mocks.tokens.mockImplementationOnce(() => new Promise(resolve => { release = () => resolve([]); }));
  const first = restartAllRunningBots(12);
  expect(isRestartAllRunning(12)).toBe(true);
  await expect(restartAllRunningBots(12)).rejects.toBeInstanceOf(RestartAllInProgressError);
  release();
  await first;
  expect(isRestartAllRunning(12)).toBe(false);
  mocks.tokens.mockRejectedValueOnce(new Error('db'));
  await expect(restartAllRunningBots(12)).rejects.toThrow('db');
  expect(isRestartAllRunning(12)).toBe(false);
});

it('повторно проверяет поколение перед стартом и защищает снимки от наблюдателя', async () => {
  mocks.instance.mockResolvedValueOnce({ status: 'running', desiredStatus: 'running' })
    .mockResolvedValueOnce({ status: 'running', desiredStatus: 'running' })
    .mockResolvedValueOnce({ desiredGeneration: 3 }).mockResolvedValueOnce({ desiredGeneration: 3 })
    .mockResolvedValueOnce({ desiredStatus: 'stopped', desiredGeneration: 4 });
  const result = await restartAllRunningBots(12, { onProgress: event => { event.results.push({ tokenId: 99, success: true }); } });
  expect(result.results).toHaveLength(2);
  expect(result.results[0].error).toBe('Перезапуск отменён новым запросом');
  expect(mocks.start).toHaveBeenCalledTimes(1);
});
