/** @fileoverview Проверки квот пользователей, резервного режима и HTTP-контракта ограничения. */
import express, { type Request } from 'express';
import { once } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ipKeyGenerator } from 'express-rate-limit';
import { UsersRateLimitStore } from './users-rate-limit-store';
import { botUsersPrincipalKey, createBotUsersRateLimit } from './users-rate-limit';

/** Управляемый клиент общей квоты для проверки отказов без подключения к инфраструктуре. */
const redis = vi.hoisted(() => ({ current: null as null | { status: string; eval: ReturnType<typeof vi.fn> } }));
vi.mock('../../redis/redisClient', () => ({ getRedisPublisher: () => redis.current }));
vi.mock('../../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: (req: Request) => req.user?.id ?? null }));
afterEach(() => { redis.current = null; vi.useRealTimers(); });

describe('квоты маршрутов пользователей бота', () => {
  it('сохраняет активные квоты при заполнении памяти и освобождает истёкшие записи', async () => {
    let now = 1000;
    const store = new UsersRateLimitStore('capacity', 1000, 2, () => now);
    expect((await store.increment('a')).totalHits).toBe(1);
    await store.increment('b');
    expect((await store.increment('c')).totalHits).toBe(Number.MAX_SAFE_INTEGER);
    expect((await store.increment('a')).totalHits).toBe(2);
    now += 1000;
    expect((await store.increment('c')).totalHits).toBe(1);
  });

  it('использует общий счётчик и не забывает его при потере Redis', async () => {
    redis.current = { status: 'ready', eval: vi.fn().mockResolvedValue([27, 50_000]) };
    const store = new UsersRateLimitStore('shared');
    expect((await store.increment('owner:1')).totalHits).toBe(27);
    expect(redis.current.eval).toHaveBeenCalledWith(expect.any(String), 1, 'bot-users-limit:shared:owner:1', '60000');
    redis.current = null;
    expect((await store.increment('owner:1')).totalHits).toBe(28);
  });

  it('не меняет principal при подмене query или актора и объединяет IPv6 подсеть', () => {
    const request = { user: { id: 42 }, botActorId: 999, query: { telegram_id: '999' } } as unknown as Request;
    expect(botUsersPrincipalKey(request)).toBe('owner:42');
    request.query.telegram_id = '123';
    request.botActorId = 123;
    expect(botUsersPrincipalKey(request)).toBe('owner:42');
    expect(ipKeyGenerator('2001:db8:1234:5601::1', 56)).toBe(ipKeyGenerator('2001:db8:1234:56ff::2', 56));
  });

  it('поздняя реплика сбрасывает локальную копию одновременно с общим окном Redis', async () => {
    vi.useFakeTimers();
    const start = Date.now();
    redis.current = { status: 'ready', eval: vi.fn().mockResolvedValueOnce([120, 1000])
      .mockResolvedValueOnce([1, 60_000]) };
    const lateReplica = new UsersRateLimitStore('rollover');
    const previous = await lateReplica.increment('owner:1');
    expect(previous.totalHits).toBe(120);
    expect(+previous.resetTime!).toBe(start + 1000);
    await vi.advanceTimersByTimeAsync(1000);
    const next = await lateReplica.increment('owner:1');
    expect(next.totalHits).toBe(1);
    expect(+next.resetTime!).toBe(start + 61_000);
    redis.current = null;
    expect((await lateReplica.increment('owner:1')).totalHits).toBe(2);
  });

  it('делит HTTP-квоту двух маршрутов, возвращает 429, Retry-After и стандартные заголовки', async () => {
    const app = express();
    const limiter = createBotUsersRateLimit('http', 2, () => 'owner:1');
    app.get(['/users', '/users/:id'], limiter, (_req, res) => res.json({ ok: true }));
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Нет адреса тестового сервера');
    const base = `http://127.0.0.1:${address.port}`;
    try {
      expect((await fetch(`${base}/users`)).status).toBe(200);
      expect((await fetch(`${base}/users/1`)).status).toBe(200);
      const response = await fetch(`${base}/users/2`);
      expect(response.status).toBe(429);
      expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
      expect(response.headers.has('ratelimit')).toBe(true);
      expect(response.headers.has('x-ratelimit-limit')).toBe(false);
      expect(await response.json()).toEqual({ error: 'RATE_LIMIT_EXCEEDED', code: 'BOT_USERS_RATE_LIMITED',
        message: 'Слишком много запросов к пользователям бота. Повторите позже.' });
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });

  it('ограничивает число зависших команд, а остальные запросы учитывает локально', async () => {
    vi.useFakeTimers();
    const resolvers: Array<(value: number[]) => void> = [];
    redis.current = { status: 'ready', eval: vi.fn(() => new Promise(resolve => resolvers.push(resolve))) };
    const store = new UsersRateLimitStore('pending');
    const requests = Array.from({ length: 40 }, (_, index) => store.increment(String(index)));
    await vi.advanceTimersByTimeAsync(150);
    expect(redis.current.eval).toHaveBeenCalledTimes(32);
    expect((await Promise.all(requests)).every(result => result.totalHits === 1)).toBe(true);
    resolvers.forEach(resolve => resolve([1, 1000]));
    await vi.advanceTimersByTimeAsync(5000);
  });

  it('завершает зависший запрос через 150 мс и применяет локальный бюджет во время паузы', async () => {
    vi.useFakeTimers();
    await vi.advanceTimersByTimeAsync(10_000);
    redis.current = { status: 'ready', eval: vi.fn(() => new Promise(() => {})) };
    const store = new UsersRateLimitStore('timeout');
    const result = store.increment('a');
    await vi.advanceTimersByTimeAsync(150);
    expect((await result).totalHits).toBe(1);
    expect((await store.increment('a')).totalHits).toBe(2);
    expect(redis.current.eval).toHaveBeenCalledTimes(1);
  });
});
