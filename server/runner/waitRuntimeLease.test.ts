/** @fileoverview Проверки передачи аренды между контейнерами, отмены и ограниченного ожидания Redis. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import type { LeaseRedis } from '../bots/runtime-lease';
import { waitRuntimeLease } from './waitRuntimeLease';

/** Создаёт Redis с занятым либо свободным ключом и проверкой владельца. */
function fakeRedis(occupied = false) {
  let owner: string | null = occupied ? 'previous' : null;
  return {
    /** Захватывает только свободную аренду. */
    set: vi.fn(async (_key: string, value: string) => {
      if (owner !== null) return null;
      owner = value;
      return 'OK';
    }),
    /** Удаляет ключ только при совпадении владельца. */
    eval: vi.fn(async (_script: string, _count: number, _key: string, value: string) => {
      if (owner !== value) return 0;
      owner = null;
      return 1;
    }),
    /** Имитирует штатное завершение предыдущего контейнера. */
    releasePrevious: () => { owner = null; },
  };
}

beforeEach(() => { vi.useFakeTimers(); vi.spyOn(console, 'log').mockImplementation(() => {}); });
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

it('немедленно получает свободную аренду', async () => {
  const redis = fakeRedis();
  const lease = await waitRuntimeLease(redis as LeaseRedis, 'default', new AbortController().signal);
  expect(lease.owner).toBeTruthy();
  expect(redis.set).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('ждёт старый контейнер, сохраняя единственного владельца', async () => {
  const redis = fakeRedis(true);
  const ready = vi.fn();
  const result = waitRuntimeLease(redis as LeaseRedis, 'default', new AbortController().signal).then(ready);
  await vi.advanceTimersByTimeAsync(35_000);
  expect(ready).not.toHaveBeenCalled();
  expect(redis.eval).not.toHaveBeenCalled();
  expect(console.log).toHaveBeenCalledTimes(1);
  redis.releasePrevious();
  await vi.advanceTimersByTimeAsync(1000);
  await result;
  expect(ready).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('ограничивает ожидание без принудительного снятия чужой аренды', async () => {
  const redis = fakeRedis(true);
  const result = waitRuntimeLease(redis as LeaseRedis, 'default', new AbortController().signal, 2500);
  const rejected = expect(result).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(2500);
  await rejected;
  expect(redis.eval).not.toHaveBeenCalled();
  expect(vi.getTimerCount()).toBe(0);
});

it('останавливает повторы по SIGTERM без захвата аренды', async () => {
  const redis = fakeRedis(true);
  const controller = new AbortController();
  const result = waitRuntimeLease(redis as LeaseRedis, 'default', controller.signal);
  const rejected = expect(result).rejects.toThrow();
  await vi.advanceTimersByTimeAsync(0);
  controller.abort();
  await rejected;
  const attempts = redis.set.mock.calls.length;
  await vi.advanceTimersByTimeAsync(3000);
  expect(redis.set).toHaveBeenCalledTimes(attempts);
});

it('отменяет зависший Redis и освобождает поздно полученную аренду', async () => {
  let respond!: (value: string) => void;
  const redis = { set: vi.fn(() => new Promise<string>(resolve => { respond = resolve; })), eval: vi.fn(async () => 1) };
  const result = waitRuntimeLease(redis as LeaseRedis, 'default', new AbortController().signal, 2500);
  const rejected = expect(result).rejects.toThrow('Истёк срок');
  await vi.advanceTimersByTimeAsync(2500);
  await rejected;
  respond('OK');
  await vi.advanceTimersByTimeAsync(0);
  expect(redis.eval).toHaveBeenCalledTimes(1);
  expect(vi.getTimerCount()).toBe(0);
});

it('не маскирует отказ Redis ожиданием занятой аренды', async () => {
  const redis = fakeRedis();
  redis.set.mockRejectedValueOnce(new Error('Redis недоступен'));
  await expect(waitRuntimeLease(redis as LeaseRedis, 'default', new AbortController().signal)).rejects.toThrow('Redis недоступен');
  expect(vi.getTimerCount()).toBe(0);
});
