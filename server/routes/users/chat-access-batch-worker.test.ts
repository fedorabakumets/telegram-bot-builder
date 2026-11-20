/** @fileoverview Проверки параллельного запуска ботов и отмены всех существующих очередей. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { ChatAccessBatch } from '../../../shared/chat-access-batch';
const mocks = vi.hoisted(() => ({ get: vi.fn(), status: vi.fn(), token: vi.fn(), update: vi.fn(), queue: vi.fn(), claim: vi.fn(), heartbeat: vi.fn(), active: new Map() }));
vi.mock('../../storages/storage', () => ({ storage: { getBotToken: mocks.token } }));
vi.mock('../dialogs/chat-access-batch-store', () => ({ chatAccessBatchStore: { get: mocks.get, setStatus: mocks.status, claim: mocks.claim, heartbeat: mocks.heartbeat } }));
vi.mock('../dialogs/chat-access-check-job-store', () => ({ updateChatAccessCheckJob: mocks.update }));
vi.mock('../dialogs/chat-access-check-queue', () => ({ activeChatAccessChecks: mocks.active, runChatAccessCheckQueue: mocks.queue }));
import { runChatAccessBatch, stopChatAccessBatch, runningChatAccessBatches } from '../dialogs/chat-access-batch-worker';
let batch: ChatAccessBatch;
beforeEach(() => {
  vi.clearAllMocks(); mocks.active.clear(); runningChatAccessBatches.clear();
  batch = { id: 1, projectId: 12, status: 'running', jobs: [9, 10].map(tokenId => ({
    jobId: tokenId, tokenId, projectId: 12, status: 'pending', totalCount: 2, processedCount: 0,
    availableCount: 0, kickedCount: 0, deletedCount: 0, errorCount: 0, startedAt: null, finishedAt: null,
  })) };
  mocks.claim.mockResolvedValue(true); mocks.heartbeat.mockResolvedValue(true);
  mocks.get.mockImplementation(async () => batch);
  mocks.status.mockImplementation(async (_project, _id, status) => { batch.status = status; });
  mocks.token.mockImplementation(async id => ({ id, projectId: 12, token: `secret-${id}` }));
  mocks.update.mockImplementation(async (id, patch) => Object.assign(batch.jobs.find(job => job.jobId === id)!, patch));
});
/** Обе очереди должны стартовать до завершения первой, а не последовательно. */
it('запускает существующие очереди ботов параллельно', async () => {
  const finish: Array<() => void> = [];
  mocks.queue.mockImplementation((id: number) => new Promise<void>(resolve => finish.push(() => {
    batch.jobs.find(job => job.jobId === id)!.status = 'completed'; resolve();
  })));
  const run = runChatAccessBatch(12, 1);
  await vi.waitFor(() => expect(mocks.queue).toHaveBeenCalledTimes(2));
  expect(batch.status).toBe('running');
  finish.forEach(resolve => resolve()); await run;
  expect(batch.status).toBe('completed');
  expect(runningChatAccessBatches.size).toBe(0);
});
/** Общая отмена помечает остановку каждой очереди и не запускает новую проверку. */
it('останавливает все очереди одной операцией', async () => {
  const finish: Array<() => void> = [];
  mocks.queue.mockImplementation((id: number) => new Promise<void>(resolve => finish.push(() => {
    batch.jobs.find(job => job.jobId === id)!.status = 'cancelled'; resolve();
  })));
  const run = runChatAccessBatch(12, 1);
  await vi.waitFor(() => expect(mocks.queue).toHaveBeenCalledTimes(2));
  await stopChatAccessBatch(12, 1);
  expect([...mocks.active.values()]).toEqual(['stopped', 'stopped']);
  finish.forEach(resolve => resolve()); await run;
  expect(batch.status).toBe('cancelled');
});
/** Ошибка одного бота не останавливает очередь остальных, чужой токен не используется. */
it('изолирует недоступного или чужого бота', async () => {
  mocks.token.mockImplementation(async id => ({ id, projectId: id === 9 ? 13 : 12, token: 'secret' }));
  mocks.queue.mockImplementation(async id => { batch.jobs.find(job => job.jobId === id)!.status = 'completed'; });
  await runChatAccessBatch(12, 1);
  expect(mocks.queue).toHaveBeenCalledTimes(1);
  expect(mocks.queue).toHaveBeenCalledWith(10, 'secret');
  expect(batch.jobs.map(job => job.status)).toEqual(['failed', 'completed']);
  expect(batch.status).toBe('failed');
  expect(mocks.status).toHaveBeenLastCalledWith(12,1,'failed','partial_failure');
});

/** Процесс не запускает группу, которой уже владеет другой работник. */
it('не запускает чужую зарезервированную группу', async () => {
  mocks.claim.mockResolvedValue(false);
  await runChatAccessBatch(12,1);
  expect(mocks.queue).not.toHaveBeenCalled();
});
