/** @fileoverview Регрессионная проверка лимитов административных маршрутов до авторизации. */
import express, { type RequestHandler } from 'express';
import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

const { auth } = vi.hoisted(() => ({ auth: vi.fn<RequestHandler>((_req, res) => { res.sendStatus(401); }) }));
vi.mock('./admin-auth-middleware', () => ({ requireAdminAuth: auth }));
vi.mock('./telegram-connection-test', () => ({ handleTestTelegramConnection: vi.fn() }));
vi.mock('./worker-runtime-status', () => ({ getWorkerRuntimeStatus: vi.fn() }));
vi.mock('./worker-bot-list', () => ({ listWorkerBots: vi.fn() }));
vi.mock('./restart-pending-workers', () => ({ restartPendingWorkers: vi.fn() }));
vi.mock('./runtime-settings-handlers', () => ({
  handleGetRuntimeSettings: vi.fn(), handlePutRuntimeSettings: vi.fn(), handleRunRuntimeBackup: vi.fn(),
}));
vi.mock('./setup-runtime-guide-routes', () => ({ setupRuntimeGuideRoutes: vi.fn() }));
vi.mock('./runtime-backup-telegram-handler', () => ({ handleTestBackupTelegram: vi.fn() }));
import { setupRuntimeSettingsRoutes } from './setup-runtime-settings-routes';

/** Прогоняет реальные HTTP-запросы и гарантированно закрывает локальный тестовый сервер.
 * @param method - Метод защищённого маршрута.
 * @param route - Путь маршрута.
 * @param allowance - Допустимое количество обращений к авторизации.
 * @returns Результат проверки ограничения до выполнения авторизации.
 */
async function verifyLimit(method: string, route: string | string[], allowance: number) {
  auth.mockClear();
  const app = express();
  setupRuntimeSettingsRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Тестовый порт не назначен');
  try {
    const routes = Array.isArray(route) ? route : [route];
    const base = `http://127.0.0.1:${address.port}`;
    for (let index = 0; index < allowance; index++) {
      expect((await fetch(base + routes[index % routes.length], { method })).status).toBe(401);
    }
    const blocked = await fetch(base + routes[0], { method });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(auth).toHaveBeenCalledTimes(allowance);
  } finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

describe('лимиты административного рантайма', () => {
  it('делит бюджет снимков между двумя виджетами и допускает их штатный опрос', async () => {
    await verifyLimit('GET', [
      '/admin/api/runtime-settings/workers/status', '/admin/api/runtime-settings/workers/bots',
    ], 60);
  });
  it.each([
    ['GET', '/admin/api/runtime-settings/workers/status', 60],
    ['GET', '/admin/api/runtime-settings/workers/bots', 60],
    ['GET', '/admin/api/runtime-settings/workers', 60],
    ['PUT', '/admin/api/runtime-settings/workers', 20],
    ['POST', '/admin/api/runtime-settings/platform/telegram/test', 20],
    ['POST', '/admin/api/runtime-settings/backups/telegram/test', 20],
    ['POST', '/admin/api/runtime-settings/backups/run', 6],
    ['POST', '/admin/api/runtime-settings/workers/restart-pending', 10],
  ])('%s %s отклоняет превышение до проверки сессии', async (method, route, allowance) => {
    await verifyLimit(method, route, allowance);
  });
});
