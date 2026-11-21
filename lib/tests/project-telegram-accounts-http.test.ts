/** @fileoverview Локальная HTTP-проверка доступа и валидации API Telegram-аккаунтов. */
import { createServer, request, type Server } from 'node:http';
import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { projectTelegramRunnerKey } from '../../server/bots/project-telegram-runner-auth';
import { ProjectTelegramAccountAuthorizationRequiredError } from '../../server/database/project-telegram-accounts-store';
import { registerProjectTelegramRunnerRoute } from '../../server/routes/project-telegram-runner-route';
import { registerProjectTelegramAccountsRoutes } from '../../server/routes/projectTelegramAccounts/project-telegram-accounts-routes';

/** Подменяет только данные проектов и доступ к хранилищу. */
const state = vi.hoisted(() => ({
  list: vi.fn(), create: vi.fn(), bind: vi.fn(), proxy: vi.fn(), remove: vi.fn(), forBot: vi.fn(), broker: vi.fn(),
  importSession: vi.fn(), saveSession: vi.fn(),
  preview: vi.fn(), cutoverAvailable: vi.fn(), canApply: vi.fn(), getPlan: vi.fn(), reserve: vi.fn(),
  apply: vi.fn(), rollback: vi.fn(), instance: vi.fn(),
}));

vi.mock('../../server/database/db', () => ({ db: {}, pool: {} }));
vi.mock('../../server/database/project-telegram-accounts-store', async importOriginal => {
  const original = await importOriginal<typeof import('../../server/database/project-telegram-accounts-store')>();
  return {
    ...original,
    listProjectTelegramAccounts: state.list, createProjectTelegramAccount: state.create,
    setProjectTelegramAccountBots: state.bind, setProjectTelegramAccountProxy: state.proxy,
    deleteProjectTelegramAccount: state.remove, getProjectTelegramAccountForBot: state.forBot,
    getProjectTelegramAccount: vi.fn(async () => account),
    getProjectTelegramAccountSecrets: vi.fn(async () => ({ session: null, proxy: null })),
    setProjectTelegramAccountSession: state.saveSession,
  };
});
vi.mock('../../server/bots/project-telegram-accounts/session-import', () => ({
  readProjectTelegramSessionImport: state.importSession,
}));
vi.mock('../../server/telegram-accounts/load-legacy-migration-preview', () => ({
  loadLegacyTelegramMigrationPreview: state.preview,
}));
vi.mock('../../server/database/project-telegram-account-cutover-journal', () => ({
  createTelegramAccountCutoverJournal: vi.fn(() => ({})),
}));
vi.mock('../../server/database/reserve-project-telegram-account-cutover', () => ({
  getTelegramAccountCutoverPlan: state.getPlan,
  listTelegramAccountCutovers: vi.fn(async () => []),
  reserveProjectTelegramAccountCutover: state.reserve,
}));
vi.mock('../../server/bots/telegram-account-cutover-runtime', () => ({
  canStartTelegramAccountCutover: state.canApply,
  isTelegramAccountCutoverAvailable: state.cutoverAvailable,
  telegramAccountCutoverRuntime: {},
}));
vi.mock('../../server/bots/telegram-account-cutover', async importOriginal => {
  const original = await importOriginal<typeof import('../../server/bots/telegram-account-cutover')>();
  return { ...original, runTelegramAccountCutover: state.apply, rollbackTelegramAccountCutover: state.rollback };
});
vi.mock('../../server/bots/project-telegram-broker-client', async importOriginal => {
  const original = await importOriginal<typeof import('../../server/bots/project-telegram-broker-client')>();
  return { ...original, callProjectTelegramBroker: state.broker };
});
vi.mock('../../server/storages/storage', () => ({
  storage: { getBotProject: async () => ({ ownerId: 101 }), getBotInstanceByToken: state.instance },
}));
vi.mock('../../server/telegram/auth-middleware', () => ({
  getOwnerIdFromRequest: (req: express.Request) => Number(req.get('x-actor')),
}));
vi.mock('../../server/middleware/requireProjectAccess', () => ({
  requireProjectAccess: async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.params.projectId !== '9' || !['101', '102'].includes(req.get('x-actor') ?? '')) {
      res.status(403).json({ message: 'Доступ запрещён' });
      return;
    }
    next();
  },
}));

let server: Server;
let port: number;
const path = '/api/projects/9/telegram-accounts';
const account = { id: 81, projectId: 9, name: 'Демо', botIds: [5, 62], status: 'connected' };

/**
 * Вызывает локальный API по настоящему HTTP без обращений за пределы стенда.
 * @param method - Метод запроса.
 * @param url - Путь в тестовом приложении.
 * @param actor - Идентификатор синтетического участника проекта.
 * @param data - Тело запроса.
 * @param authorization - Тестовый ключ исполнителя.
 * @returns Код и декодированный JSON.
 */
function call(method: string, url: string, actor: number, data?: unknown, authorization?: string) {
  return new Promise<{ /** Код ответа. */ status: number; /** Тело ответа. */ body: unknown }>((resolve, reject) => {
    const req = request({ hostname: '127.0.0.1', port, method, path: url, headers: {
      'x-actor': String(actor), 'content-type': 'application/json',
      ...(authorization ? { authorization } : {}),
    } }, res => {
      let body = '';
      res.setEncoding('utf8').on('data', chunk => { body += chunk; });
      res.on('end', () => {
        try { resolve({ status: res.statusCode ?? 0, body: JSON.parse(body) }); }
        catch (error) { reject(error); }
      });
      res.on('error', reject);
    });
    req.on('error', reject);
    req.setTimeout(2_000, () => req.destroy(new Error('Локальный API не ответил вовремя')));
    req.end(data === undefined ? undefined : JSON.stringify(data));
  });
}

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  registerProjectTelegramAccountsRoutes(app);
  registerProjectTelegramRunnerRoute(app);
  server = createServer(app);
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  if (typeof address !== 'object' || !address) throw new Error('Локальный HTTP-сервер не запущен');
  port = address.port;
});

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
  vi.stubEnv('PROJECT_TELEGRAM_RUNNER_SECRET', 'синтетический-ключ-приёмки-исполнителя');
  state.list.mockResolvedValue([account]);
  state.bind.mockResolvedValue(account);
  state.instance.mockResolvedValue({ desiredGeneration: 0, status: 'running' });
});

describe('Внутренний вызов общего Telegram-клиента', () => {
  const executePath = '/internal/project-telegram/9/5/execute';
  const command = { operation: 'status', args: {} };

  it('проверяет подпись бота до запроса в хранилище и формат команды до вызова брокера', async () => {
    const otherKey = `Bearer ${projectTelegramRunnerKey(9, 62)}`;
    expect((await call('POST', executePath, 0, command, otherKey)).status).toBe(401);
    const key = `Bearer ${projectTelegramRunnerKey(9, 5)}`;
    expect((await call('POST', executePath, 0, { ...command, args: { extra: true } }, key)).status).toBe(400);
    expect(state.forBot).not.toHaveBeenCalled();
    expect(state.broker).not.toHaveBeenCalled();
  });

  it('отклоняет отсутствующую или отключённую привязку до обращения к Telegram', async () => {
    const key = `Bearer ${projectTelegramRunnerKey(9, 5)}`;
    expect((await call('POST', executePath, 0, command, key)).status).toBe(409);
    state.forBot.mockResolvedValueOnce({ accountId: 81, session: null });
    expect((await call('POST', executePath, 0, command, key)).status).toBe(409);
    expect(state.broker).not.toHaveBeenCalled();
  });

  it('отправляет запросы двух ботов одному аккаунту и очищает внутреннюю сетевую ошибку', async () => {
    const marker = 'СИНТЕТИЧЕСКИЙ_СЕКРЕТ';
    state.forBot.mockResolvedValue({ accountId: 81, session: { apiId: '123', apiHash: marker, sessionString: marker }, proxy: null });
    state.broker.mockResolvedValueOnce({ connected: true }).mockRejectedValueOnce(new Error(marker));
    const first = await call('POST', executePath, 0, command, `Bearer ${projectTelegramRunnerKey(9, 5, 0, 81)}`);
    const second = await call(
      'POST', '/internal/project-telegram/9/62/execute', 0, command, `Bearer ${projectTelegramRunnerKey(9, 62, 0, 81)}`,
    );
    expect(first).toEqual({ status: 200, body: { result: { connected: true } } });
    expect(second).toEqual({ status: 503, body: { code: 'BROKER_UNAVAILABLE' } });
    expect(state.forBot.mock.calls).toEqual([[9, 5], [9, 62]]);
    expect(state.broker.mock.calls.map(([action, payload]) => [action, payload.accountId])).toEqual([
      ['execute', 81], ['execute', 81],
    ]);
  });

  it('не передаёт брокеру команды остановленного процесса и старого поколения', async () => {
    state.forBot.mockResolvedValue({ accountId: 81, session: { apiId: '123', apiHash: 'fake', sessionString: 'fake' } });
    const key = `Bearer ${projectTelegramRunnerKey(9, 5, 0, 81)}`;
    state.instance.mockResolvedValueOnce({ desiredGeneration: 0, status: 'stopped' });
    expect((await call('POST', executePath, 0, command, key)).status).toBe(401);
    state.instance.mockResolvedValueOnce({ desiredGeneration: 1, status: 'running' });
    expect((await call('POST', executePath, 0, command, key)).status).toBe(401);
    state.instance.mockResolvedValueOnce({ desiredGeneration: 0, status: 'running' });
    state.forBot.mockResolvedValueOnce({ accountId: 82, session: { apiId: '123', apiHash: 'fake', sessionString: 'fake' } });
    expect((await call('POST', executePath, 0, command, key)).status).toBe(401);
    expect(state.broker).not.toHaveBeenCalled();
  });
});

afterAll(async () => {
  vi.unstubAllEnvs();
  server.closeAllConnections();
  await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
});

describe('Подтверждение переноса аккаунта по HTTP', () => {
  const applyPath = `${path}/migration/apply`;
  const rollbackPath = `${path}/migration/rollback`;

  it('отказывает до записи, если нет подтверждаемой среды запуска', async () => {
    state.cutoverAvailable.mockReturnValue(false);
    const response = await call('POST', applyPath, 101, { migrationId: 'operation-1', groupId: 5 });
    expect(response).toMatchObject({ status: 409, body: { code: 'CUTOVER_UNAVAILABLE' } });
    expect(state.getPlan).not.toHaveBeenCalled();
    expect(state.reserve).not.toHaveBeenCalled();
  });

  it('сверяет группу предварительного просмотра и продолжает откат по сохранённой операции', async () => {
    state.cutoverAvailable.mockReturnValue(true);
    state.canApply.mockReturnValue(true);
    const group = { id: 5, botIds: [5, 62], disposition: 'create' };
    const migrationId = 'operation-1';
    const saved = { id: migrationId, projectId: 9, accountId: 81, botIds: [5, 62] };
    state.preview.mockResolvedValue({ groups: [group], excluded: [] });
    state.reserve.mockResolvedValue(saved);
    state.apply.mockResolvedValue('shared-ready');
    expect((await call('POST', applyPath, 102, { migrationId, groupId: 5 })).status).toBe(403);
    expect((await call('POST', applyPath, 101, { migrationId, groupId: 62 })).status).toBe(409);
    expect(state.reserve).not.toHaveBeenCalled();
    expect(await call('POST', applyPath, 101, { migrationId, groupId: 5 })).toEqual({
      status: 200, body: { migrationId, accountId: 81, phase: 'shared-ready' },
    });
    expect(state.reserve).toHaveBeenCalledExactlyOnceWith(9, migrationId, group);

    state.getPlan.mockResolvedValueOnce(saved);
    state.rollback.mockResolvedValue('rolled-back');
    expect(await call('POST', rollbackPath, 101, { migrationId })).toEqual({
      status: 200, body: { migrationId, accountId: 81, phase: 'rolled-back' },
    });
    expect(state.rollback).toHaveBeenCalledExactlyOnceWith(saved, {}, {});
  });
});

describe('HTTP API Telegram-аккаунтов', () => {
  it('проверяет доступ к проекту до чтения хранилища', async () => {
    expect((await call('GET', '/api/projects/10/telegram-accounts', 101)).status).toBe(403);
    expect((await call('GET', path, 103)).status).toBe(403);
    expect(state.list).not.toHaveBeenCalled();
  });

  it('не читает данные при выключенной функции', async () => {
    vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '0');
    expect(await call('GET', path, 101)).toMatchObject({
      status: 404, body: { code: 'PROJECT_TELEGRAM_ACCOUNTS_DISABLED' },
    });
    expect(state.list).not.toHaveBeenCalled();
  });

  it('даёт участнику читать карточки, а управлять привязками только владельцу', async () => {
    expect(await call('GET', path, 102)).toEqual({
      status: 200, body: { enabled: true, canManage: false, accounts: [account] },
    });
    expect((await call('PUT', `${path}/81/bots`, 102, { botIds: [5, 62] })).status).toBe(403);
    expect(state.bind).not.toHaveBeenCalled();

    expect((await call('PUT', `${path}/81/bots`, 101, { botIds: [5, 62, 5] })).status).toBe(200);
    expect(state.bind).toHaveBeenCalledExactlyOnceWith(9, 81, [5, 62]);
  });

  it('отклоняет некорректный запрос и не выдаёт внутреннюю ошибку хранилища', async () => {
    expect((await call('PUT', `${path}/81/bots`, 101, { botIds: [-5] })).status).toBe(400);
    expect(state.bind).not.toHaveBeenCalled();
    const marker = 'СИНТЕТИЧЕСКИЙ_СЕКРЕТ';
    state.bind.mockRejectedValueOnce(new Error(marker));
    const response = await call('PUT', `${path}/81/bots`, 101, { botIds: [5] });
    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain(marker);
  });

  it('отличает неподтверждённую сессию от сбоя БД при привязке', async () => {
    state.bind.mockRejectedValueOnce(new ProjectTelegramAccountAuthorizationRequiredError());
    expect((await call('PUT', `${path}/81/bots`, 101, { botIds: [5] })).status).toBe(409);
  });

  it('не записывает сессию после отказа импорта', async () => {
    const marker = 'СИНТЕТИЧЕСКИЙ_СЕКРЕТ';
    state.importSession.mockRejectedValueOnce(new Error(marker));
    const response = await call('POST', `${path}/81/import`, 101, { kind: 'string-session' });
    expect(response.status).toBe(500);
    expect(state.saveSession).not.toHaveBeenCalled();
    expect(JSON.stringify(response.body)).not.toContain(marker);
  });

  it('отклоняет внутренний адрес прокси до сохранения и проверяет форму публичного адреса без соединения', async () => {
    const proxy = { type: 'socks5', host: '127.0.0.1', port: 1080 };
    expect((await call('PUT', `${path}/81/proxy`, 101, { proxy })).status).toBe(400);
    expect(state.proxy).not.toHaveBeenCalled();
    const result = await call('POST', `${path}/81/proxy/test`, 101, { ...proxy, host: '1.1.1.1' });
    expect(result).toMatchObject({ status: 200, body: { ok: true } });
    expect(state.proxy).not.toHaveBeenCalled();
    expect(state.broker).not.toHaveBeenCalled();
  });
});

describe('Квоты внутреннего исполнителя', () => {
  /** Подмена идентификаторов и неподписанных заголовков не создаёт новые квоты источника. */
  it('ограничивает неподписанные обращения до чтения БД и возвращает время повтора', async () => {
    for (let batch = 0; batch < 12; batch++) {
      const responses = await Promise.all(Array.from({ length: 50 }, (_, index) =>
        call('POST', `/internal/project-telegram/9/${batch * 50 + index + 1}/execute`, 0,
          { operation: 'status', args: {} }, `Bearer fake-${batch}-${index}`)));
      expect(responses.every(response => [401, 429].includes(response.status))).toBe(true);
    }
    const response = await fetch(`http://127.0.0.1:${port}/internal/project-telegram/9/5/execute`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ operation: 'status', args: {} }),
    });
    expect(response.status).toBe(429);
    expect(Number(response.headers.get('retry-after'))).toBeGreaterThan(0);
    expect(await response.json()).toEqual({ code: 'RUNNER_RATE_LIMITED' });
    expect(state.forBot).not.toHaveBeenCalled();
    expect(state.broker).not.toHaveBeenCalled();
  });

  /** Переполнение квоты одного подписанного бота не блокирует другого на том же IP runtime. */
  it('изолирует квоты разных ботов и сохраняет лимит при смене поколения ключа', async () => {
    for (let batch = 0; batch < 12; batch++) {
      const key = `Bearer ${projectTelegramRunnerKey(9, 5, batch)}`;
      await Promise.all(Array.from({ length: 50 }, () => call('POST', '/internal/project-telegram/9/5/execute',
        0, { operation: 'status', args: { extra: true } }, key)));
    }
    expect((await call('POST', '/internal/project-telegram/9/5/execute', 0,
      { operation: 'status', args: {} }, `Bearer ${projectTelegramRunnerKey(9, 5, 13)}`)).status).toBe(429);
    expect(state.forBot).not.toHaveBeenCalled();
    state.forBot.mockResolvedValue({ accountId: 81, session: { apiId: '123', apiHash: 'fake', sessionString: 'fake' } });
    state.broker.mockResolvedValue({ authorized: true });
    expect(await call('POST', '/internal/project-telegram/9/62/execute', 0,
      { operation: 'status', args: {} }, `Bearer ${projectTelegramRunnerKey(9, 62, 0, 81)}`))
      .toEqual({ status: 200, body: { result: { authorized: true } } });
    expect(state.broker).toHaveBeenCalledTimes(1);
  });
});
