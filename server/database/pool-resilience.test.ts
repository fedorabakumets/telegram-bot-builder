/** @fileoverview Проверки освобождения клиентов, объединения восстановления и безопасной диагностики. */
import { afterEach, expect, it, vi } from 'vitest';
import type { Pool } from 'pg';
import { createPoolRecovery, probePool } from './pool-recovery';
import { installPoolAcquireDiagnostics } from './pool-diagnostics';
afterEach(() => vi.useRealTimers());
it('уничтожает клиента при ошибке проверки, не теряя исходную ошибку', async () => {
  const error = new Error('broken');
  const release = vi.fn();
  const pool = { connect: vi.fn().mockResolvedValue({ query: vi.fn().mockRejectedValue(error), release }) };
  await expect(probePool(pool as unknown as Pool)).rejects.toBe(error);
  expect(release).toHaveBeenCalledTimes(1); expect(release).toHaveBeenCalledWith(true);
});
it('возвращает исправного клиента', async () => {
  const release = vi.fn();
  await probePool({ connect: vi.fn().mockResolvedValue({ query: vi.fn().mockResolvedValue({}), release }) } as unknown as Pool);
  expect(release).toHaveBeenCalledTimes(1); expect(release).toHaveBeenCalledWith(false);
});
it('объединяет ошибки до и во время проверки, а после остановки не публикует успех', async () => {
  vi.useFakeTimers();
  let finish!: () => void;
  const release = vi.fn();
  const pool = { connect: vi.fn().mockResolvedValue({ query: () => new Promise<void>(resolve => { finish = resolve; }), release }) };
  const active = vi.fn();
  const recovery = createPoolRecovery(pool as unknown as Pool, active, 10);
  recovery.schedule(); recovery.schedule();
  await vi.advanceTimersByTimeAsync(10);
  recovery.schedule();
  expect(pool.connect).toHaveBeenCalledTimes(1);
  recovery.stop(); finish();
  await vi.advanceTimersByTimeAsync(100);
  expect(active).not.toHaveBeenCalledWith(true);
  expect(release).toHaveBeenCalledTimes(1);
});
it('отменяет таймер остановкой и восстанавливается после временной ошибки с увеличенной паузой', async () => {
  vi.useFakeTimers();
  const release = vi.fn();
  const pool = { connect: vi.fn().mockRejectedValueOnce(new Error('offline'))
    .mockResolvedValue({ query: vi.fn().mockResolvedValue({}), release }) };
  const first = createPoolRecovery(pool as unknown as Pool, vi.fn(), 10);
  first.schedule(); first.stop();
  await vi.advanceTimersByTimeAsync(20);
  expect(pool.connect).not.toHaveBeenCalled();
  const active = vi.fn();
  const second = createPoolRecovery(pool as unknown as Pool, active, 10);
  second.schedule(); await vi.advanceTimersByTimeAsync(10);
  expect(pool.connect).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(19);
  expect(pool.connect).toHaveBeenCalledTimes(1);
  await vi.advanceTimersByTimeAsync(1);
  expect(pool.connect).toHaveBeenCalledTimes(2);
  expect(active).toHaveBeenLastCalledWith(true);
  await vi.advanceTimersByTimeAsync(1000);
  expect(pool.connect).toHaveBeenCalledTimes(2);
  second.stop();
});
it('ограничивает паузу повторов тридцатью секундами и отменяет повтор при остановке', async () => {
  vi.useFakeTimers();
  const pool = { connect: vi.fn().mockRejectedValue(new Error('offline')) };
  const recovery = createPoolRecovery(pool as unknown as Pool, vi.fn());
  recovery.schedule();
  for (const delay of [5000, 10000, 20000, 30000, 30000]) await vi.advanceTimersByTimeAsync(delay);
  expect(pool.connect).toHaveBeenCalledTimes(5);
  recovery.stop(); await vi.advanceTimersByTimeAsync(60000);
  expect(pool.connect).toHaveBeenCalledTimes(5);
});
it('сохраняет promise/callback ошибки и пишет только безопасные метрики', async () => {
  const error = new Error('timeout secret://password SQL');
  const pool = { totalCount: 10, idleCount: 0, waitingCount: 4, options: { max: 10 }, connect: vi.fn((callback?: Function) => {
    if (callback) { callback(error, undefined, undefined); return; }
    return Promise.reject(error);
  }) } as unknown as Pool;
  const log = vi.fn(); installPoolAcquireDiagnostics(pool, log);
  await expect(pool.connect()).rejects.toBe(error);
  const callback = vi.fn(); pool.connect(callback);
  expect(callback.mock.calls[0][0]).toBe(error);
  expect(log).toHaveBeenCalledTimes(2);
  expect(log.mock.calls[0][0]).toMatchObject({ total: 10, idle: 0, waiting: 4, max: 10, event: 'acquire_timeout' });
  expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|password|SQL/);
});
it('успешный callback сохраняет клиента и освобождение, не пишет ложный таймаут', () => {
  const client = {}, release = vi.fn(), callback = vi.fn(), log = vi.fn();
  const pool = { connect: (cb: Function) => cb(undefined, client, release) } as unknown as Pool;
  installPoolAcquireDiagnostics(pool, log); pool.connect(callback);
  expect(callback).toHaveBeenCalledWith(undefined, client, release);
  expect(release).not.toHaveBeenCalled(); expect(log).not.toHaveBeenCalled();
});

