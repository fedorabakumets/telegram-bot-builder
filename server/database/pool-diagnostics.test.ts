/** @fileoverview Узкие проверки метрик и удержания клиентов PostgreSQL без подключения к базе. */
import { EventEmitter } from 'node:events';
import type { Pool, PoolClient } from 'pg';
import { afterEach, expect, it, vi } from 'vitest';
import { installPoolAcquireDiagnostics, snapshotPool, suppressPoolClientHoldWarning } from './pool-diagnostics';
/** Создаёт пул, воспроизводящий события выдачи и возврата настоящего pg. */
function fixture() {
  const events = new EventEmitter();
  const client = {} as PoolClient;
  const release = vi.fn((error?: Error | boolean) => events.emit('release', error, client));
  client.release = release;
  const pool = Object.assign(events, { totalCount: 3, idleCount: 1, waitingCount: 2, options: { max: 5 },
    connect: vi.fn((callback?: Function) => {
      events.emit('acquire', client);
      if (callback) { callback(undefined, client, release); return; }
      return Promise.resolve(client);
    }) }) as unknown as Pool;
  const log = vi.fn();
  installPoolAcquireDiagnostics(pool, log, 100);
  return { pool, client, release, log };
}
afterEach(() => { vi.clearAllTimers(); vi.useRealTimers(); });
it('показывает занятые, свободные и ожидающие соединения', () => {
  expect(snapshotPool(fixture().pool)).toEqual({ total: 3, idle: 1, acquired: 2, waiting: 2, max: 5 });
});
it('однократно предупреждает о долгом удержании и снова отслеживает повторную выдачу', async () => {
  vi.useFakeTimers();
  const { pool, client, log } = fixture();
  expect(await pool.connect()).toBe(client);
  await vi.advanceTimersByTimeAsync(1000);
  expect(log).toHaveBeenCalledTimes(1);
  expect(log).toHaveBeenCalledWith(expect.objectContaining({ event: 'client_held', durationMs: 100, owner: expect.stringContaining('pool-diagnostics.test.ts') }));
  expect(log.mock.calls[0][0].owner).not.toMatch(/node_modules|node:|pool-diagnostics\.ts/);
  client.release(); await pool.connect();
  await vi.advanceTimersByTimeAsync(100);
  expect(log).toHaveBeenCalledTimes(2);
});
it('сохраняет callback release с флагом уничтожения и отменяет предупреждение', async () => {
  vi.useFakeTimers();
  const { pool, client, release, log } = fixture();
  pool.connect((error, received, done) => {
    expect(error).toBeUndefined(); expect(received).toBe(client); expect(done).toBe(release); done(true);
  });
  await vi.advanceTimersByTimeAsync(100);
  expect(release).toHaveBeenCalledWith(true); expect(log).not.toHaveBeenCalled();
});
it('отменяет предупреждение при удалении клиента и явном исключении постоянного клиента', async () => {
  vi.useFakeTimers();
  const { pool, client, log } = fixture();
  await pool.connect(); pool.emit('remove', client);
  await vi.advanceTimersByTimeAsync(100);
  await pool.connect(); suppressPoolClientHoldWarning(client);
  await vi.advanceTimersByTimeAsync(100);
  expect(log).not.toHaveBeenCalled();
});
it('не дублирует подписки и изолирует ошибку обработчика диагностики', async () => {
  vi.useFakeTimers();
  const { pool, log } = fixture();
  installPoolAcquireDiagnostics(pool, () => { throw new Error('diagnostics'); }, 1);
  await pool.connect(); await vi.advanceTimersByTimeAsync(100);
  expect(log).toHaveBeenCalledTimes(1); expect(pool.listenerCount('acquire')).toBe(1);
  pool.emit('release', undefined, await pool.connect());
  const unsafe = vi.fn(() => { throw new Error('diagnostics'); });
  /** Отдельный пул проверяет изоляцию обработчика без повторной установки. */
  const raw = new EventEmitter() as Pool;
  Object.assign(raw, { options: {}, totalCount: 1, idleCount: 0, waitingCount: 0, connect: vi.fn() });
  installPoolAcquireDiagnostics(raw, unsafe, 1);
  raw.emit('acquire', {} as PoolClient);
  await vi.advanceTimersByTimeAsync(1);
  expect(unsafe).toHaveBeenCalledTimes(1);
});
