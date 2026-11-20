/** @fileoverview Проверка исключительного владения очередью и остановки при потере аренды. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: mocks }));
import { startChatAccessJobLease } from '../dialogs/chat-access-job-lease';
beforeEach(() => { mocks.query.mockReset(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
/** Задача с другим владельцем не исполняется вторым процессом. */
it('не захватывает уже исполняемую задачу', async () => {
  mocks.query.mockResolvedValue({ rowCount:0 });
  expect(await startChatAccessJobLease(3,vi.fn())).toBeNull();
  expect(mocks.query.mock.calls[0][0]).toContain('worker_id IS NULL');
});
/** Потеря владения прекращает очередь, а освобождение убирает таймер. */
it('останавливает очередь при потере владения и освобождает таймер', async () => {
  mocks.query.mockResolvedValueOnce({ rowCount:1 }).mockResolvedValue({ rowCount:0 });
  const lost = vi.fn(), release = await startChatAccessJobLease(3,lost);
  await vi.advanceTimersByTimeAsync(15_000);
  expect(lost).toHaveBeenCalledOnce();
  release!();
  await vi.advanceTimersByTimeAsync(30_000);
  expect(mocks.query).toHaveBeenCalledTimes(2);
});
