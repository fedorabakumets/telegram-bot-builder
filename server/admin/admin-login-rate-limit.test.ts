/** @fileoverview Проверки перебора административного ключа, IP-изоляции и ограничений TTL-хранилища. */
import express, { type Request, type RequestHandler, type Response } from 'express';
import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';
import { adminLoginIpKey, createAdminLoginRateLimit } from './admin-login-rate-limit';

/** Выполняет запрос без сетевого прокси; заголовок XFF намеренно не становится req.ip.
 * @param middleware - Проверяемая защита.
 * @param ip - Адрес, разрешённый Express.
 * @param forwarded - Поддельный заголовок пересылки.
 * @returns Ответ и признак допуска к проверке ключа.
 */
function attempt(middleware: RequestHandler, ip: string, forwarded = '') {
  const next = vi.fn();
  const res = { set: vi.fn(), status: vi.fn(), json: vi.fn() };
  res.status.mockReturnValue(res);
  const req = { ip, socket: { remoteAddress: '127.0.0.1' }, headers: { 'x-forwarded-for': forwarded } };
  middleware(req as Request, res as unknown as Response, next);
  return { next, ...res };
}

describe('защита административного входа', () => {
  it('не допускает перебор после лимита и возвращает Retry-After без продления окна', () => {
    let time = 0;
    const limit = createAdminLoginRateLimit({ max: 2, windowMs: 10_000, now: () => time });
    expect(attempt(limit, '192.0.2.1').next).toHaveBeenCalledOnce();
    expect(attempt(limit, '192.0.2.1').next).toHaveBeenCalledOnce();
    time = 1500;
    const blocked = attempt(limit, '192.0.2.1');
    expect(blocked.next).not.toHaveBeenCalled();
    expect(blocked.status).toHaveBeenCalledWith(429);
    expect(blocked.set).toHaveBeenCalledWith('Retry-After', '9');
    time = 10_000;
    expect(attempt(limit, '192.0.2.1').next).toHaveBeenCalledOnce();
  });

  it('изолирует IP и не позволяет обойти лимит изменением произвольного XFF', () => {
    const limit = createAdminLoginRateLimit({ max: 1 });
    attempt(limit, '192.0.2.1', '198.51.100.1');
    expect(attempt(limit, '192.0.2.1', '198.51.100.2').status).toHaveBeenCalledWith(429);
    expect(attempt(limit, '192.0.2.2').next).toHaveBeenCalledOnce();
  });

  it('объединяет варианты IPv6 и IPv4-mapped, ограничивает подсеть IPv6 /64', () => {
    const limit = createAdminLoginRateLimit({ max: 1 });
    attempt(limit, '2001:db8:0:1::1');
    expect(attempt(limit, '2001:0db8:0000:0001:abcd::2').status).toHaveBeenCalledWith(429);
    expect(attempt(limit, '2001:db8:0:2::1').next).toHaveBeenCalledOnce();
    attempt(limit, '::ffff:192.0.2.1');
    expect(attempt(limit, '192.0.2.1').status).toHaveBeenCalledWith(429);
    expect(adminLoginIpKey({ ip: 'invalid', socket: {} } as Request)).toBe('unknown');
  });

  it('не вытесняет активные записи при заполнении и освобождает ёмкость после TTL', () => {
    let time = 0;
    const limit = createAdminLoginRateLimit({ max: 1, capacity: 2, windowMs: 1000, now: () => time });
    attempt(limit, '192.0.2.1');
    attempt(limit, '192.0.2.2');
    for (let i = 3; i < 100; i++) expect(attempt(limit, `192.0.2.${i}`).status).toHaveBeenCalledWith(429);
    expect(attempt(limit, '192.0.2.1').status).toHaveBeenCalledWith(429);
    time = 1000;
    expect(attempt(limit, '192.0.2.100').next).toHaveBeenCalledOnce();
    expect(attempt(limit, '192.0.2.101').next).toHaveBeenCalledOnce();
    expect(attempt(limit, '192.0.2.102').status).toHaveBeenCalledWith(429);
  });

  it('возвращает настоящий HTTP 429 до проверки ключа и доверяет только настройке Express', async () => {
    const app = express();
    const validateKey = vi.fn((_req, res: Response) => { res.redirect('/admin/login?error=1'); });
    app.post('/admin/api/login', createAdminLoginRateLimit({ max: 1 }), validateKey);
    const server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Нет тестового порта');
    try {
      const url = `http://127.0.0.1:${address.port}/admin/api/login`;
      expect((await fetch(url, { method: 'POST', redirect: 'manual' })).status).toBe(302);
      const response = await fetch(url, { method: 'POST', headers: { 'X-Forwarded-For': '192.0.2.4' } });
      expect(response.status).toBe(429);
      expect(response.headers.get('retry-after')).toBe('600');
      expect(validateKey).toHaveBeenCalledOnce();
    } finally {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    }
  });
});
