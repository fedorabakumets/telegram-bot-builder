/** @fileoverview Проверка безопасных параметров сессии для обычного и локального запуска. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { resolveSessionCookieOptions } from '../../utils/resolveSessionCookie';

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
    expect(resolveSessionCookieOptions()).toMatchObject({ secure: true, httpOnly: true, sameSite: 'none' });
  });

  it('ограничивает исключение для локального HTTP привязкой к loopback', () => {
    vi.stubEnv('COOKIE_SECURE', 'false');
    vi.stubEnv('HOST', '0.0.0.0');
    expect(resolveSessionCookieOptions().secure).toBe(true);
    vi.stubEnv('HOST', '127.0.0.1');
    expect(resolveSessionCookieOptions()).toMatchObject({ secure: false, httpOnly: true, sameSite: 'lax' });
  });

  it('сохраняет Secure за HTTPS прокси даже при локальной привязке', () => {
    vi.stubEnv('HOST', '127.0.0.1');
    vi.stubEnv('COOKIE_SECURE', 'false');
    vi.stubEnv('API_BASE_URL', 'https://example.com');
    expect(resolveSessionCookieOptions().secure).toBe(true);
  });

  it('поддерживает обычный локальный запуск в режиме разработки', () => {
    vi.stubEnv('NODE_ENV', 'development');
    expect(resolveSessionCookieOptions().secure).toBe(false);
  });
});
