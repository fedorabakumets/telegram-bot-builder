/** @fileoverview Проверка режима сервера и сохранения защиты административных страниц. */
import express from 'express';
import type { Server } from 'node:http';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveAppMode } from './app-mode';

vi.mock('../admin/admin-auth-middleware', () => ({ isAdminAuthenticated: vi.fn() }));
vi.mock('../admin/resolve-admin-key', () => ({ resolveAdminApiKey: () => 'test-key' }));
vi.mock('../admin/admin-session', () => ({ setAdminCookie: vi.fn((res) => res.cookie('admin', 'test')) }));
import { isAdminAuthenticated } from '../admin/admin-auth-middleware';
import { passAdminPageToClient } from '../admin/admin-client-pages';

/** Закрывает тестовый сервер без ожидания keep-alive соединений. */
async function closeServer(server: Server): Promise<void> {
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

describe('режим HTTP-сервера', () => {
  it('по умолчанию сохраняет единое приложение и отклоняет опечатки', () => {
    vi.stubEnv('APP_MODE', '');
    expect(resolveAppMode()).toBe('combined');
    expect(resolveAppMode('combined')).toBe('combined');
    expect(resolveAppMode('backend')).toBe('backend');
    expect(() => resolveAppMode('fronted')).toThrow('APP_MODE');
  });

  it.each(['combined', 'backend'])('сохраняет redirect для гостя в %s', async mode => {
    vi.stubEnv('APP_MODE', mode);
    vi.mocked(isAdminAuthenticated).mockReturnValue(false);
    const app = express();
    app.get('/admin', passAdminPageToClient);
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Нет тестового порта');
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/admin`, { redirect: 'manual' });
      expect(response.status).toBe(302);
      expect(response.headers.get('location')).toBe('/admin/login');
      expect(response.headers.has('x-botcraft-client-page')).toBe(false);
    } finally { await closeServer(server); }
  });

  it.each(['combined', 'backend'])('после авторизации выбирает правильный ответ в %s', async mode => {
    vi.stubEnv('APP_MODE', mode);
    vi.mocked(isAdminAuthenticated).mockReturnValue(true);
    const app = express();
    app.get('/admin', passAdminPageToClient, (_req, res) => { res.send('SPA'); });
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>(resolve => server.once('listening', resolve));
    const address = server.address();
    if (!address || typeof address === 'string') throw new Error('Нет тестового порта');
    try {
      const response = await fetch(`http://127.0.0.1:${address.port}/admin`);
      expect(response.headers.get('set-cookie')).toContain('admin=test');
      expect(response.status).toBe(mode === 'backend' ? 204 : 200);
      expect(response.headers.get('x-botcraft-client-page')).toBe(mode === 'backend' ? '1' : null);
      expect(await response.text()).toBe(mode === 'backend' ? '' : 'SPA');
    } finally { await closeServer(server); }
  });
});
