/** @fileoverview Тесты MCP-обёртки массовой проверки доступов. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getChatAccessCheckInDb, startChatAccessCheckInDb } from './chat-access-check-db.ts';

const fetchMock = vi.fn();
vi.mock('./api-fetch.ts', () => ({ apiFetch: (...args: unknown[]) => fetchMock(...args) }));

/** Карточка задачи в формате HTTP API. */
const runningJob = {
  jobId: 41, projectId: 12, tokenId: 9, status: 'running',
  totalCount: 174, processedCount: 0, availableCount: 0, kickedCount: 0, deletedCount: 0, errorCount: 0,
  startedAt: '2026-10-15T06:00:00.000Z', finishedAt: null,
};

describe('chat-access-check-db', () => {
  beforeEach(() => fetchMock.mockReset());

  it('запускает проверку и отдаёт карточку в snake_case', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({ job: runningJob }) });
    await expect(startChatAccessCheckInDb(12, { token_id: 9 })).resolves.toEqual({
      ok: true, project_id: 12, token_id: 9,
      job: {
        job_id: 41, project_id: 12, token_id: 9, status: 'running',
        total_count: 174, processed_count: 0, available_count: 0,
        kicked_count: 0, deleted_count: 0, error_count: 0,
        started_at: '2026-10-15T06:00:00.000Z', finished_at: null,
      },
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/12/chat-access-checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId: 9 }),
    });
  });

  it('при уже идущей проверке возвращает безопасную ошибку', async () => {
    fetchMock.mockResolvedValue({
      ok: false, status: 409, json: async () => ({ message: 'token leaked' }),
    });
    await expect(startChatAccessCheckInDb(12, { token_id: 9 }))
      .resolves.toEqual({ error: 'Проверка уже выполняется' });
  });

  it('пустую аудиторию возвращает сразу завершённой', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 201, json: async () => ({
      job: { ...runningJob, status: 'completed', totalCount: 0, finishedAt: '2026-10-15T06:00:01.000Z' },
    }) });
    await expect(startChatAccessCheckInDb(12, { token_id: 9 })).resolves.toMatchObject({
      ok: true, job: { status: 'completed', total_count: 0, finished_at: '2026-10-15T06:00:01.000Z' },
    });
  });

  it('отдаёт null, если проверок ещё не было', async () => {
    fetchMock.mockResolvedValue({ ok: true, status: 200, json: async () => ({ job: null }) });
    await expect(getChatAccessCheckInDb(12, { token_id: 9 }))
      .resolves.toEqual({ ok: true, project_id: 12, token_id: 9, job: null });
    expect(fetchMock).toHaveBeenCalledWith('/api/projects/12/chat-access-checks/active?tokenId=9');
  });

  it('не прокидывает чужой текст ошибки', async () => {
    fetchMock.mockResolvedValue({
      ok: false, status: 404, json: async () => ({ message: 'secret bot token' }),
    });
    await expect(getChatAccessCheckInDb(12, { token_id: 9 }))
      .resolves.toEqual({ error: 'Не удалось получить статус проверки: HTTP 404' });
  });
});
