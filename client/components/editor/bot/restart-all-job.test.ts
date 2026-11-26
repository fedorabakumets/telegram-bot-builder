/** @fileoverview Проверки фонового перезапуска: ожидание, восстановление и отсутствие ложного успеха. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runRestartAllJob, savedRestartJob } from './restart-all-job';

/** Сформировать короткий ответ сервера задания. */
const response = (body: unknown, status = 200) => Promise.resolve(new Response(JSON.stringify(body), { status }));
/** Завершённое задание с одним успешным ботом. */
const completed = { jobId: 'job-1', projectId: 12, status: 'completed', result: {
  ok: true, restarted: 1, failed: 0, results: [{ tokenId: 45, success: true }],
} };

describe('restart-all job', () => {
  beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); });
  afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

  it('не считает 202 успехом и опрашивает задание до результата', async () => {
    const fetcher = vi.fn().mockImplementationOnce(() => response({ ...completed, status: 'queued', result: undefined }, 202))
      .mockImplementationOnce(() => response(completed));
    vi.stubGlobal('fetch', fetcher);
    const progress = vi.fn();
    const promise = runRestartAllJob(12, progress);
    await vi.advanceTimersByTimeAsync(1500);
    expect(await promise).toEqual(completed.result);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(fetcher).toHaveBeenNthCalledWith(1, '/api/projects/12/bot/restart-all/jobs', expect.objectContaining({ method: 'POST' }));
    expect(fetcher).toHaveBeenNthCalledWith(2, '/api/projects/12/bot/restart-all/jobs/job-1', expect.objectContaining({ method: 'GET' }));
    expect(savedRestartJob()).toBeNull();
  });

  it('после обновления страницы читает сохранённое задание без нового POST', async () => {
    sessionStorage.setItem('bot-restart-all-active', JSON.stringify({ projectId: 12, jobId: 'job-1' }));
    const fetcher = vi.fn(() => response(completed));
    vi.stubGlobal('fetch', fetcher);
    await runRestartAllJob(12, vi.fn());
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetcher).toHaveBeenCalledWith('/api/projects/12/bot/restart-all/jobs/job-1', expect.objectContaining({ method: 'GET' }));
  });

  it('сохраняет ID при потерянном статусе и не выдаёт успех', async () => {
    sessionStorage.setItem('bot-restart-all-active', JSON.stringify({ projectId: 12, jobId: 'job-1' }));
    vi.stubGlobal('fetch', vi.fn(() => response({ message: 'Задание не найдено; проверьте состояние ботов' }, 404)));
    await expect(runRestartAllJob(12, vi.fn())).rejects.toThrow('Задание не найдено');
    expect(savedRestartJob()?.jobId).toBe('job-1');
  });

  it('не запускает второй POST при двух одновременных вызовах', async () => {
    const fetcher = vi.fn(() => response(completed));
    vi.stubGlobal('fetch', fetcher);
    const first = runRestartAllJob(12, vi.fn());
    const second = runRestartAllJob(12, vi.fn());
    await Promise.all([first, second]);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('терминальная ошибка отклоняет результат и очищает завершённое задание', async () => {
    vi.stubGlobal('fetch', vi.fn(() => response({ ...completed, status: 'failed', error: 'Исполнитель недоступен' })));
    await expect(runRestartAllJob(12, vi.fn())).rejects.toThrow('Исполнитель недоступен');
    expect(savedRestartJob()).toBeNull();
  });

  it('прерывает зависший HTTP за 10 секунд без повторного POST', async () => {
    const fetcher = vi.fn((_url, options) => new Promise((_resolve, reject) => {
      options.signal.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
    }));
    vi.stubGlobal('fetch', fetcher);
    const assertion = expect(runRestartAllJob(12, vi.fn())).rejects.toThrow('10 секунд');
    await vi.advanceTimersByTimeAsync(10000);
    await assertion;
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
