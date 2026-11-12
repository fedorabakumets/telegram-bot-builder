/** @fileoverview Проверка квот настроек бота и сохранения проверки владения ресурсом. */
import express from 'express';
import { once } from 'node:events';
import { describe, expect, it, vi } from 'vitest';

/** Счётчик подтверждает, что превышение квоты отсекается до проверки доступа к БД. */
const ownership = vi.hoisted(() => ({ calls: 0 }));
vi.mock('../middleware/requireProjectAccess', () => ({ requireProjectAccess: vi.fn() }));
vi.mock('../middleware/bot-api-actor', () => ({ resolveBotApiActor: vi.fn() }));
vi.mock('../middleware/requireResourceOwnership', () => ({
  requireBotTokenOwnership: vi.fn(),
  requireTokenOwnership: (req: express.Request, res: express.Response, next: express.NextFunction) => {
    ownership.calls++;
    if (req.headers['x-test-owner'] !== 'yes') { res.status(403).end(); return; }
    next();
  },
}));
vi.mock('./botManagement/handlers/botRuntimeSettingsHandler', () => ({
  handleBotRuntimeSettings: (_req: express.Request, res: express.Response) => res.json({ ok: true }),
}));
vi.mock('./botManagement/handlers/botStartHandler', () => ({ handleBotStart: vi.fn() }));
vi.mock('./botManagement/handlers/botStopHandler', () => ({ handleBotStop: vi.fn() }));
vi.mock('./botManagement/handlers/botRestartHandler', () => ({ handleBotRestart: vi.fn() }));
vi.mock('./botManagement/handlers/botRestartAllHandler', () => ({ handleBotRestartAll: vi.fn() }));
vi.mock('./botManagement/handlers/botStartOfflineAllHandler', () => ({ handleBotStartOfflineAll: vi.fn() }));
vi.mock('./botManagement/handlers/botProjectStatusesHandler', () => ({ handleBotProjectStatuses: vi.fn() }));
vi.mock('./botManagement/handlers/botStatusByTokenHandler', () => ({ handleBotStatusByToken: vi.fn() }));
vi.mock('./botManagement/handlers/getBotTokenStatusHandler', () => ({ getBotTokenStatusHandler: vi.fn() }));
vi.mock('./botManagement/handlers/getBotTokenPhotoHandler', () => ({ getBotTokenPhotoHandler: vi.fn() }));
vi.mock('./botManagement/handlers/botLaunchHistoryHandler', () => ({ handleGetLaunchHistory: vi.fn() }));
vi.mock('./botManagement/handlers/botLaunchLogsHandler', () => ({ handleGetLaunchLogs: vi.fn() }));
vi.mock('./botManagement/handlers/workerStatsHandler', () => ({ handleWorkerStats: vi.fn() }));
vi.mock('./botManagement/handlers/clearLogsHandler', () => ({ handleClearLogs: vi.fn() }));
vi.mock('./botManagement/handlers/botLiveLogsHandler', () => ({ handleGetLiveBotLogs: vi.fn() }));
vi.mock('./botManagement/handlers/botLogByIdHandler', () => ({ handleGetBotLogById: vi.fn() }));
import { setupBotManagementRoutes } from './setupBotManagementRoutes';

/** Создаёт изолированный сервер и гарантирует закрытие соединений после проверки. */
async function withRuntimeApi(check: (url: string) => Promise<void>): Promise<void> {
  const app = express();
  setupBotManagementRoutes(app);
  const server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('Не получен адрес тестового сервера');
  try { await check(`http://127.0.0.1:${address.port}/api/projects/1/tokens/1/runtime-settings`); }
  finally {
    server.closeAllConnections();
    await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  }
}

describe('ограничения настроек режима бота', () => {
  it('не снимает проверку владения для чтения и записи', async () => {
    await withRuntimeApi(async url => {
      for (const method of ['GET', 'PUT']) {
        expect((await fetch(url, { method })).status).toBe(403);
        expect((await fetch(url, { method, headers: { 'x-test-owner': 'yes' } })).status).toBe(200);
      }
    });
  });

  it('ограничивает запись до проверки владения и оставляет отдельную квоту чтения', async () => {
    await withRuntimeApi(async url => {
      ownership.calls = 0;
      for (let index = 0; index < 20; index++) expect((await fetch(url, { method: 'PUT' })).status).toBe(403);
      const response = await fetch(url, { method: 'PUT' });
      expect(response.status).toBe(429);
      expect(ownership.calls).toBe(20);
      expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
      expect(response.headers.has('ratelimit-limit')).toBe(true);
      expect(response.headers.has('x-ratelimit-limit')).toBe(false);
      expect((await fetch(url, { headers: { 'x-test-owner': 'yes' } })).status).toBe(200);
    });
  });

  it('ограничивает чтение даже при смене идентификатора бота', async () => {
    await withRuntimeApi(async url => {
      ownership.calls = 0;
      for (let index = 0; index < 120; index++) expect((await fetch(url)).status).toBe(403);
      expect((await fetch(url.replace('/tokens/1/', '/tokens/2/'))).status).toBe(429);
      expect(ownership.calls).toBe(120);
    });
  });
});
