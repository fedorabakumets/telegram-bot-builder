/** @fileoverview Проверка безопасных параметров сессии для обычного и локального запуска. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request } from 'express';
import { applySessionCookiePolicy, shouldUseSecureSessionCookie } from '../../utils/resolveSessionCookie';

/** Прямой HTTP-запрос локального браузера. */
const localRequest = {
  secure: false,
  headers: { host: 'localhost:5000' },
  socket: { localAddress: '127.0.0.1', remoteAddress: '127.0.0.1' },
};

describe('Флаги сессионной cookie', () => {
  beforeEach(() => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('HOST', undefined);
    vi.stubEnv('API_BASE_URL', undefined);
    vi.stubEnv('WEBHOOK_BASE_URL', undefined);
    vi.stubEnv('COOKIE_SECURE', undefined);
    vi.stubEnv('RAILWAY_PUBLIC_DOMAIN', undefined);
    vi.stubEnv('RAILWAY_STATIC_URL', undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  it('включает Secure по умолчанию в production, даже без внешнего URL', () => {
    expect(shouldUseSecureSessionCookie(localRequest)).toBe(true);
  });

  it('ограничивает исключение для локального HTTP привязкой к loopback', () => {
    vi.stubEnv('COOKIE_SECURE', 'false');
    vi.stubEnv('HOST', '0.0.0.0');
    expect(shouldUseSecureSessionCookie(localRequest)).toBe(true);
    vi.stubEnv('HOST', '127.0.0.1');
    expect(shouldUseSecureSessionCookie(localRequest)).toBe(false);
  });

  it('сохраняет Secure за HTTPS прокси даже при локальной привязке', () => {
    vi.stubEnv('HOST', '127.0.0.1');
    vi.stubEnv('COOKIE_SECURE', 'false');
    vi.stubEnv('API_BASE_URL', 'https://example.com');
    expect(shouldUseSecureSessionCookie(localRequest)).toBe(true);
  });

  it('поддерживает обычный локальный запуск в режиме разработки', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(shouldUseSecureSessionCookie(localRequest)).toBe(false);
    expect(shouldUseSecureSessionCookie({
      ...localRequest, socket: { localAddress: '::1', remoteAddress: '::1' }, headers: { host: '[::1]:5000' },
    })).toBe(false);
  });

  it('включает Secure для сетевого соседа и запросов через HTTPS-прокси в режиме разработки', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(shouldUseSecureSessionCookie({
      ...localRequest, socket: { ...localRequest.socket, remoteAddress: '192.0.2.10' },
    })).toBe(true);
    expect(shouldUseSecureSessionCookie({ ...localRequest, headers: { host: 'workspace.example:5000' } })).toBe(true);
    expect(shouldUseSecureSessionCookie({
      ...localRequest, headers: { ...localRequest.headers, 'x-forwarded-proto': 'https' },
    })).toBe(true);
    expect(shouldUseSecureSessionCookie({ ...localRequest, secure: true })).toBe(true);
  });

  it('возвращает безопасные флаги cookie, сохранённой старой локальной сессией', () => {
    const cookie = { secure: false, sameSite: 'lax', httpOnly: true, maxAge: 1000 };
    applySessionCookiePolicy({ ...localRequest, session: { cookie } } as unknown as Request);
    expect(cookie).toEqual({ secure: true, sameSite: 'none', httpOnly: true, maxAge: 1000 });
  });
});
