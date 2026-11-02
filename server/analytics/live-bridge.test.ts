/** @fileoverview Проверки повторной доставки и восстановления сохранённых версий после обрыва канала. */
import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { startAnalyticsLiveBridge } from './live-bridge';
/** Локальная доставка без Redis и базы приложения. */
const mocks = vi.hoisted(() => ({ publish: vi.fn().mockResolvedValue(undefined), status: vi.fn().mockResolvedValue(undefined) }));
vi.mock('../terminal/broadcastProjectEvent', () => ({ broadcastProjectEventLocal: mocks.publish }));
vi.mock('./live-status', () => ({ setAnalyticsTransportStatus: mocks.status }));
afterEach(() => { vi.useRealTimers(); vi.clearAllMocks(); });
describe('Восстановление уведомлений', () => {
  it('после потери LISTEN догоняет ревизию и не рассылает повторно одинаковую версию', async () => {
    vi.useFakeTimers();
    let revision = '1';
    const clients: Array<EventEmitter & { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> }> = [];
    const pool = {
      connect: vi.fn(async () => {
        const client = Object.assign(new EventEmitter(), { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() });
        clients.push(client); return client;
      }),
      query: vi.fn(async (sql: string) => ({ rows: sql.includes('analytics_versions_v2') ? [{ project_id: 12, revision }] : [{ report: 'audience' }] })),
    } as unknown as Pool;
    const stop = startAnalyticsLiveBridge(pool);
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.publish).toHaveBeenCalledTimes(1);
    clients[0].emit('notification');
    await vi.advanceTimersByTimeAsync(150);
    expect(mocks.publish).toHaveBeenCalledTimes(1);
    clients[0].emit('error', new Error('Канал недоступен'));
    revision = '3';
    await vi.advanceTimersByTimeAsync(3001);
    expect(mocks.status).toHaveBeenCalledWith(false);
    expect(mocks.status).toHaveBeenLastCalledWith(true);
    expect(mocks.publish).toHaveBeenCalledTimes(2);
    expect(mocks.publish.mock.calls[1][1].data.revision).toBe('3');
    stop();
    expect(clients[1].release).toHaveBeenCalledWith(true);
  });
  it('поздний ответ и ошибка старого соединения не оживляют или закрывают новый канал', async () => {
    vi.useFakeTimers();
    let finishFirst: ((value: { rows: unknown[] }) => void) | undefined;
    const firstQuery = new Promise<{ rows: unknown[] }>(resolve => { finishFirst = resolve; });
    const clients: Array<EventEmitter & { query: ReturnType<typeof vi.fn>; release: ReturnType<typeof vi.fn> }> = [];
    const pool = {
      connect: vi.fn(async () => {
        const client = Object.assign(new EventEmitter(), { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() });
        clients.push(client); return client;
      }),
      query: vi.fn().mockReturnValueOnce(firstQuery).mockResolvedValue({ rows: [] }),
    } as unknown as Pool;
    const stop = startAnalyticsLiveBridge(pool);
    await vi.advanceTimersByTimeAsync(1);
    clients[0].emit('error', new Error('Разрыв во время сверки'));
    await vi.advanceTimersByTimeAsync(3001);
    expect(mocks.status.mock.calls.map(call => call[0])).toEqual([false, true]);
    clients[0].emit('error', new Error('Запоздавшая ошибка'));
    finishFirst?.({ rows: [{ project_id: 12, revision: '99' }] });
    await vi.advanceTimersByTimeAsync(1);
    expect(clients[1].release).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(mocks.status.mock.calls.map(call => call[0])).toEqual([false, true]);
    stop();
  });
  it('остановка во время начальной сверки не объявляет канал подключённым', async () => {
    vi.useFakeTimers();
    let finish: ((value: { rows: unknown[] }) => void) | undefined;
    const query = new Promise<{ rows: unknown[] }>(resolve => { finish = resolve; });
    const listener = Object.assign(new EventEmitter(), { query: vi.fn().mockResolvedValue({ rows: [] }), release: vi.fn() });
    const pool = { connect: vi.fn().mockResolvedValue(listener), query: vi.fn().mockReturnValue(query) } as unknown as Pool;
    const stop = startAnalyticsLiveBridge(pool);
    await vi.advanceTimersByTimeAsync(1);
    stop(); finish?.({ rows: [] });
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.status).not.toHaveBeenCalledWith(true);
    expect(listener.release).toHaveBeenCalledTimes(1);
  });
});
