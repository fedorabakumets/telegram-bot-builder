/** @fileoverview Проверки атомарного отключения только отвергнутой версии секрета. */
import { beforeEach, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
const mocks = vi.hoisted(() => ({ get: vi.fn(), emit: vi.fn(), update: vi.fn(), returning: vi.fn(), where: vi.fn(), set: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: { getBotToken: mocks.get } }));
vi.mock('../terminal/emitTokenUpdated', () => ({ emitTokenUpdated: mocks.emit }));
vi.mock('../database/db', () => ({ db: { update: mocks.update } }));
import { markBotTokenUnauthorized } from './mark-bot-token-unauthorized';
import { refuseInactiveBotStart } from './refuse-inactive-bot-start';
import { isRuntimeTokenUnauthorized } from './is-runtime-token-unauthorized';
/** Каждый запуск начинает с действующего токена и успешного атомарного обновления. */
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ id: 4, projectId: 2, token: 'old', isActive: 1 });
  mocks.update.mockReturnValue({ set: mocks.set });
  mocks.set.mockReturnValue({ where: mocks.where });
  mocks.where.mockReturnValue({ returning: mocks.returning });
  mocks.returning.mockResolvedValue([{ id: 4 }]);
  mocks.emit.mockResolvedValue(undefined);
});
it('сохраняет причину и атомарно сравнивает проект, секрет и прежнюю причину', async () => {
  await markBotTokenUnauthorized(2, 4, 'old');
  expect(mocks.set).toHaveBeenCalledWith(expect.objectContaining({ isActive: 0, authorizationError: 'unauthorized' }));
  const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
  expect(query.params).toEqual([4, 2, 'old', 'unauthorized']);
  expect(query.sql).toContain('"authorization_error" is null');
  expect(mocks.emit).toHaveBeenCalledTimes(1);
});
it('не отключает секрет, заменённый до чтения', async () => {
  mocks.get.mockResolvedValue({ projectId: 2, token: 'new' });
  await markBotTokenUnauthorized(2, 4, 'old');
  expect(mocks.update).not.toHaveBeenCalled();
});
it('не уведомляет после проигранного сравнения при замене между чтением и записью', async () => {
  mocks.returning.mockResolvedValue([]);
  await markBotTokenUnauthorized(2, 4, 'old');
  expect(mocks.emit).not.toHaveBeenCalled();
});
it('не изменяет токен другого проекта', async () => {
  await markBotTokenUnauthorized(3, 4, 'old');
  expect(mocks.update).not.toHaveBeenCalled();
});
it('не запускает подтверждённо недействительный токен даже при isActive=1', () => {
  expect(refuseInactiveBotStart(1, 'unauthorized')).toContain('Токен недействителен');
  expect(refuseInactiveBotStart(1, null)).toBeNull();
});
it('отличает Telegram 401 от остальных ошибок воркера', () => {
  expect(isRuntimeTokenUnauthorized('TelegramUnauthorizedError: Telegram server says - Unauthorized')).toBe(true);
  for (const error of ['Unauthorized third-party API', 'TelegramForbiddenError: Forbidden', 'TelegramRetryAfter: 429',
    'FROZEN_METHOD_INVALID', 'TimeoutError', undefined]) expect(isRuntimeTokenUnauthorized(error)).toBe(false);
});
