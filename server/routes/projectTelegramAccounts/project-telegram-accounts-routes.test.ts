/** @fileoverview Проверяет границы доступа и строгую валидацию маршрутов Telegram-аккаунтов. */
import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import express from 'express';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getBotProject: vi.fn(async () => ({ ownerId: 100 })),
  hasProjectAccess: vi.fn(async (_project: number, actor: number) => actor === 100 || actor === 200),
  listAccounts: vi.fn(async () => [{ id: 12, name: 'Аккаунт', botIds: [5] }]),
  setBots: vi.fn(async () => ({ id: 12, botIds: [5] })),
}));

vi.mock('../../storages/storage', () => ({ storage: mocks }));
vi.mock('../../telegram/auth-middleware', () => ({
  getOwnerIdFromRequest: (request: express.Request) => Number(request.get('x-test-actor')) || null,
}));
vi.mock('../../database/project-telegram-accounts-store', () => ({
  listProjectTelegramAccounts: mocks.listAccounts,
  setProjectTelegramAccountBots: mocks.setBots,
  createProjectTelegramAccount: vi.fn(),
  deleteProjectTelegramAccount: vi.fn(),
  setProjectTelegramAccountProxy: vi.fn(),
  InvalidProjectTelegramAccountBotsError: Error,
  ProjectTelegramAccountCutoverActiveError: Error,
  ProjectTelegramAccountUnavailableForEditError: Error,
  ProjectTelegramAccountAuthorizationRequiredError: Error,
  ProjectTelegramAccountBindingLockedError: Error,
}));
vi.mock('./register-legacy-migration-preview', () => ({ registerLegacyTelegramMigrationPreview: vi.fn() }));
vi.mock('./register-legacy-migration-cutover', () => ({ registerLegacyTelegramMigrationCutover: vi.fn() }));
vi.mock('./project-telegram-account-connection-routes', () => ({ registerProjectTelegramAccountConnectionRoutes: vi.fn() }));

import { registerProjectTelegramAccountsRoutes } from './project-telegram-accounts-routes';

describe('публичное API Telegram-аккаунтов', () => {
  const app = express();
  app.use(express.json());
  registerProjectTelegramAccountsRoutes(app);
  let server: ReturnType<typeof app.listen>;
  let base: string;

  beforeAll(async () => {
    server = app.listen(0, '127.0.0.1');
    await once(server, 'listening');
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });
  afterAll(() => new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  }));
  afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });

  /**
   * Обращается к локальному обработчику с выбранной тестовой личностью.
   * @param actor - Идентификатор тестового пользователя.
   * @param suffix - Путь ресурса или пустая строка для списка.
   * @param body - Данные PUT-запроса, если нужны.
   * @returns Ответ заблокированного или разрешённого маршрута.
   */
  function request(actor: number, suffix = '', body?: unknown) {
    return fetch(`${base}/api/projects/9/telegram-accounts${suffix}`, {
      method: body ? 'PUT' : 'GET', headers: { 'content-type': 'application/json', 'x-test-actor': String(actor) },
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  it('выдаёт однозначный признак выключенной функции без чтения карточек', async () => {
    vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '0');
    const response = await request(100);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ code: 'PROJECT_TELEGRAM_ACCOUNTS_DISABLED' });
    expect(mocks.listAccounts).not.toHaveBeenCalled();
  });

  it('позволяет коллаборатору читать список, но запрещает менять привязку', async () => {
    vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
    const list = await request(200);
    expect(list.headers.get('cache-control')).toBe('no-store');
    expect(await list.json()).toMatchObject({ canManage: false, accounts: [{ id: 12 }] });
    expect((await request(200, '/12/bots', { botIds: [5] })).status).toBe(403);
    expect(mocks.setBots).not.toHaveBeenCalled();
  });

  it('не раскрывает список пользователю без доступа к проекту', async () => {
    vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
    expect((await request(999)).status).toBe(403);
    expect(mocks.listAccounts).not.toHaveBeenCalled();
  });

  it('передаёт хранилищу только проверенные идентификаторы внутри проекта', async () => {
    vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
    expect((await request(100, '/12extra/bots', { botIds: [5] })).status).toBe(400);
    expect((await request(100, '/12/bots', { botIds: [-5] })).status).toBe(400);
    expect(mocks.setBots).not.toHaveBeenCalled();
    expect((await request(100, '/12/bots', { botIds: [5, 5] })).status).toBe(200);
    expect(mocks.setBots).toHaveBeenCalledWith(9, 12, [5]);
  });
});
