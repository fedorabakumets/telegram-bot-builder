/** @fileoverview Проверки повторной доставки и восстановления сохранённых версий после обрыва канала. */
import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { Client, Pool } from 'pg';
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
    const clients: Array<EventEmitter & { query: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }> = [];
    const pool = {
      createListener: vi.fn(() => {
        const client = Object.assign(new EventEmitter(), { query: vi.fn().mockResolvedValue({ rows: [] }), connect: vi.fn().mockResolvedValue(undefined), end: vi.fn().mockResolvedValue(undefined) });
        clients.push(client); return client;
      }),
      query: vi.fn(async (sql: string) => ({ rows: sql.includes('analytics_versions_v2') ? [{ project_id: 12, revision }] : [{ report: 'audience' }] })),
    };
    const stop = startAnalyticsLiveBridge(pool as unknown as Pool, pool.createListener as unknown as () => Client);
    await vi.advanceTimersByTimeAsync(1);
    expect(clients[0].query).toHaveBeenCalledWith('LISTEN analytics_v2_changed');
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
    expect(clients[1].end).toHaveBeenCalledTimes(1);
  });
  it('поздний ответ и ошибка старого соединения не оживляют или закрывают новый канал', async () => {
    vi.useFakeTimers();
    let finishFirst: ((value: { rows: unknown[] }) => void) | undefined;
    const firstQuery = new Promise<{ rows: unknown[] }>(resolve => { finishFirst = resolve; });
    const clients: Array<EventEmitter & { query: ReturnType<typeof vi.fn>; end: ReturnType<typeof vi.fn> }> = [];
    const pool = {
      createListener: vi.fn(() => {
        const client = Object.assign(new EventEmitter(), { query: vi.fn().mockResolvedValue({ rows: [] }), connect: vi.fn().mockResolvedValue(undefined), end: vi.fn().mockResolvedValue(undefined) });
        clients.push(client); return client;
      }),
      query: vi.fn().mockReturnValueOnce(firstQuery).mockResolvedValue({ rows: [] }),
    };
    const stop = startAnalyticsLiveBridge(pool as unknown as Pool, pool.createListener as unknown as () => Client);
    await vi.advanceTimersByTimeAsync(1);
    clients[0].emit('error', new Error('Разрыв во время сверки'));
    await vi.advanceTimersByTimeAsync(3001);
    expect(mocks.status.mock.calls.map(call => call[0])).toEqual([false, true]);
    clients[0].emit('error', new Error('Запоздавшая ошибка'));
    finishFirst?.({ rows: [{ project_id: 12, revision: '99' }] });
    await vi.advanceTimersByTimeAsync(1);
    expect(clients[1].end).not.toHaveBeenCalled();
    expect(mocks.publish).not.toHaveBeenCalled();
    expect(mocks.status.mock.calls.map(call => call[0])).toEqual([false, true]);
    stop();
  });
  it('остановка во время начальной сверки не объявляет канал подключённым', async () => {
    vi.useFakeTimers();
    let finish: ((value: { rows: unknown[] }) => void) | undefined;
    const query = new Promise<{ rows: unknown[] }>(resolve => { finish = resolve; });
    const listener = Object.assign(new EventEmitter(), { query: vi.fn().mockResolvedValue({ rows: [] }), connect: vi.fn().mockResolvedValue(undefined), end: vi.fn().mockResolvedValue(undefined) });
    const pool = { createListener: vi.fn(() => listener), query: vi.fn().mockReturnValue(query) };
    const stop = startAnalyticsLiveBridge(pool as unknown as Pool, pool.createListener as unknown as () => Client);
    await vi.advanceTimersByTimeAsync(1);
    stop(); finish?.({ rows: [] });
    await vi.advanceTimersByTimeAsync(1);
    expect(mocks.status).not.toHaveBeenCalledWith(true);
    expect(listener.end).toHaveBeenCalledTimes(1);
  });
  it('не занимает клиента пула и закрывает неуспешное подключение перед повтором', async () => {
    vi.useFakeTimers();
    const listener = Object.assign(new EventEmitter(), {
      connect: vi.fn().mockRejectedValueOnce(new Error('Нет связи')).mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ rows: [] }), end: vi.fn().mockResolvedValue(undefined),
    });
    const pool = { connect: vi.fn(), query: vi.fn().mockResolvedValue({ rows: [] }) };
    const createListener = vi.fn(() => listener as unknown as Client);
    const stop = startAnalyticsLiveBridge(pool as unknown as Pool, createListener);
    await vi.advanceTimersByTimeAsync(1);
    expect(listener.end).toHaveBeenCalledTimes(1);
    expect(mocks.status).toHaveBeenCalledWith(false);
    await vi.advanceTimersByTimeAsync(3001);
    expect(createListener).toHaveBeenCalledTimes(2);
    expect(pool.connect).not.toHaveBeenCalled();
    expect(mocks.status).toHaveBeenLastCalledWith(true);
    stop();
  });
  it('закрывает соединение при остановке до завершения подключения', async () => {
    vi.useFakeTimers();
    let finish: (() => void) | undefined;
    const connecting = new Promise<void>(resolve => { finish = resolve; });
    const listener = Object.assign(new EventEmitter(), {
      connect: vi.fn(() => connecting), query: vi.fn(), end: vi.fn().mockResolvedValue(undefined),
    });
    const pool = { query: vi.fn() };
    const stop = startAnalyticsLiveBridge(pool as unknown as Pool, () => listener as unknown as Client);
    stop(); finish?.();
    await vi.advanceTimersByTimeAsync(10000);
    expect(listener.end).toHaveBeenCalledTimes(1);
    expect(listener.query).not.toHaveBeenCalled();
    expect(mocks.status).not.toHaveBeenCalled();
  });
});
