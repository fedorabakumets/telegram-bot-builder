/** @fileoverview Интеграционные проверки быстрой постановки и безопасного опроса перезапуска. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { RestartAllJobs, restartAllJobs } from './restart-all-jobs';
import { handleBotRestartAll, handleBotRestartAllJob } from './handlers/botRestartAllHandler';
import type { RestartAllRunningBotsResult } from '../../bots/restartAllRunningBots';

vi.mock('../../bots/restartAllRunningBots', () => ({
  restartAllRunningBots: vi.fn(), isRestartAllRunning: () => false,
  RestartAllInProgressError: class extends Error {},
}));

/** Дождаться запуска фонового задания, не ожидая его долгого результата. */
const tick = () => new Promise<void>(resolve => setImmediate(resolve));
/** Итог частичного запуска после отказа по памяти. */
const partial: RestartAllRunningBotsResult = { ok: true, restarted: 1, failed: 1,
  results: [{ tokenId: 45, success: false, error: 'Недостаточно памяти' },
    { tokenId: 46, success: true, processId: 'worker_12' }] };

beforeEach(() => vi.restoreAllMocks());

it('принимает задание немедленно, объединяет повторы и изолирует проекты', async () => {
  let release!: (result: RestartAllRunningBotsResult) => void;
  const run = vi.fn(() => new Promise<RestartAllRunningBotsResult>(resolve => { release = resolve; }));
  const jobs = new RestartAllJobs(run);
  const first = jobs.start(12);
  expect(first.status).toBe('queued');
  expect(run).not.toHaveBeenCalled();
  expect(jobs.start(12).jobId).toBe(first.jobId);
  expect(jobs.get(13, first.jobId)).toBeUndefined();
  await tick();
  expect(run).toHaveBeenCalledTimes(1);
  expect(jobs.get(12, first.jobId)?.status).toBe('running');
  release(partial);
  await tick();
  expect(jobs.get(12, first.jobId)).toMatchObject({ status: 'completed', result: partial });
  expect(jobs.start(12).jobId).not.toBe(first.jobId);
  await tick();
  release(partial);
  await tick();
});

it('закрывает фоновый отказ без вывода секрета или исключения в HTTP', async () => {
  const jobs = new RestartAllJobs(vi.fn(async () => { throw new Error('private-token:secret'); }));
  const first = jobs.start(12);
  await tick();
  const failed = jobs.get(12, first.jobId);
  expect(failed?.status).toBe('failed');
  expect(JSON.stringify(failed)).not.toContain('private-token');
  expect(jobs.start(12).jobId).not.toBe(first.jobId);
  await tick();
});

it('возвращает копии прогресса и не сообщает NaN при частичном отказе', async () => {
  const jobs = new RestartAllJobs(vi.fn(async (_id, options) => {
    const progress = { phase: 'starting' as const, total: 2, completed: 1, stopped: 2,
      stopFailed: 0, attempted: 1, restarted: 0, failed: 1, results: [partial.results[0]] };
    options?.onProgress?.(progress);
    progress.results = [];
    return partial;
  }));
  const first = jobs.start(12);
  await tick();
  const saved = jobs.get(12, first.jobId)!;
  expect(saved.progress.results).toHaveLength(1);
  saved.progress.results.length = 0;
  expect(jobs.get(12, first.jobId)?.progress.results).toHaveLength(1);
  expect(JSON.stringify(saved)).not.toContain('NaN');
});

it('HTTP возвращает 202 с ID задания, а опрос чужого проекта — 404', async () => {
  const payload = { jobId: 'opaque-id', projectId: 12, status: 'queued' };
  vi.spyOn(restartAllJobs, 'start').mockReturnValue(payload as ReturnType<RestartAllJobs['start']>);
  vi.spyOn(restartAllJobs, 'get').mockReturnValue(undefined);
  const response = { status: vi.fn(), json: vi.fn(), setHeader: vi.fn() };
  response.status.mockReturnValue(response);
  await handleBotRestartAll({ params: { id: '12' } } as unknown as Request, response as unknown as Response);
  expect(response.status).toHaveBeenCalledWith(202);
  expect(response.json).toHaveBeenCalledWith(payload);
  await handleBotRestartAllJob({ params: { id: '13', jobId: 'opaque-id' } } as unknown as Request,
    response as unknown as Response);
  expect(restartAllJobs.get).toHaveBeenCalledWith(13, 'opaque-id');
  expect(response.status).toHaveBeenLastCalledWith(404);
});
