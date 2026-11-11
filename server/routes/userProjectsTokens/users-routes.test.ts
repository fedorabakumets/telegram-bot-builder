/** @fileoverview Проверки доступа и совместимости цепочки получения пользователей бота. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { resolveBotApiActor } from '../../middleware/bot-api-actor';
import { requireBotUsersTokenAccess } from './handlers/users/bot-users-access';
import { getBotTokenUsersHandler } from './handlers/users/getBotTokenUsersHandler';
import { getBotTokenUserHandler } from './handlers/users/getBotTokenUserHandler';

const mocks = vi.hoisted(() => ({ token: vi.fn(), access: vi.fn(), query: vi.fn(), photo: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { getBotToken: mocks.token, hasProjectAccess: mocks.access } }));
vi.mock('../../database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('./handlers/users/bot-user-photo-cache', () => ({ getBotUserPhotoUrl: mocks.photo }));

/**
 * Выполняет проверки актора, доступа и обработчик с подменённым хранилищем.
 * @param params - Параметры пути.
 * @param query - Параметры запроса.
 * @param owner - Авторизованный пользователь либо отсутствие авторизации.
 * @returns Ответ цепочки обработчиков.
 */
async function request(params = { tokenId: '7' } as Record<string, string>, query = {}, owner: number | null = 42) {
  const req = { params, query, user: owner === null ? undefined : { id: owner } } as unknown as Request;
  const res = { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const response = res as unknown as Response;
  const actorNext = vi.fn();
  resolveBotApiActor(req, response, actorNext);
  if (actorNext.mock.calls.length) {
    const accessNext = vi.fn();
    await requireBotUsersTokenAccess(req, response, accessNext);
    if (accessNext.mock.calls.length) {
      await (params.userId ? getBotTokenUserHandler : getBotTokenUsersHandler)(req, response);
    }
  }
  return res;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.token.mockResolvedValue({ id: 7, projectId: 9, token: 'test-token' });
  mocks.access.mockResolvedValue(true);
  mocks.query.mockResolvedValue({ rows: [] });
  mocks.photo.mockResolvedValue(null);
});

describe('Доступ к пользователям токена', () => {
  it.each([Infinity, 1.5, -1, 0])('отклоняет некорректный actorId %s до БД', async (botActorId) => {
    const req = { botActorId, params: { tokenId: '7' }, query: {} } as unknown as Request;
    const res = { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn() };
    const next = vi.fn();
    await requireBotUsersTokenAccess(req, res as unknown as Response, next);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.token).not.toHaveBeenCalled();
    expect(next).not.toHaveBeenCalled();
  });
  it('без авторизации останавливается до хранилища', async () => {
    const res = await request({ tokenId: '7' }, {}, null);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.token).not.toHaveBeenCalled();
    expect(mocks.query).not.toHaveBeenCalled();
  });
  it('подмена telegram_id не позволяет читать чужих пользователей', async () => {
    const res = await request({ tokenId: '7' }, { telegram_id: '99' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it('чужой проект не вызывает SQL и загрузку фотографии', async () => {
    mocks.access.mockResolvedValue(false);
    const res = await request({ tokenId: '7', userId: '123' });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(mocks.query).not.toHaveBeenCalled();
    expect(mocks.photo).not.toHaveBeenCalled();
  });
  it.each(['7junk', '-7', '0', 'token_', '9007199254740992'])('отклоняет tokenId %s до БД', async (tokenId) => {
    const res = await request({ tokenId });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it.each(['123junk', '../123', '0', '9007199254740992'])('отклоняет userId %s до БД', async (userId) => {
    const res = await request({ tokenId: '7', userId });
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it.each([{ limit: '-1' }, { limit: '2abc' }, { offset: '-1' }, { limit: ['2', '3'] }])('отклоняет неверную пагинацию %j', async (query) => {
    const res = await request({ tokenId: '7' }, query);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.token).not.toHaveBeenCalled();
  });
  it('отсутствующий токен возвращает 404 без проверки проекта', async () => {
    mocks.token.mockResolvedValue(undefined);
    const res = await request();
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.access).not.toHaveBeenCalled();
  });
  it.each([getBotTokenUserHandler, getBotTokenUsersHandler])('обработчик без контекста доступа закрыт', async (handler) => {
    const req = { params: { tokenId: '7', userId: '123' }, query: {} } as unknown as Request;
    const res = { locals: {}, status: vi.fn().mockReturnThis(), json: vi.fn() };
    await handler(req, res as unknown as Response);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.query).not.toHaveBeenCalled();
  });
});

describe('Совместимость ответов', () => {
  it('поддерживает token_ и прежний ответ пагинации при единственной проверке доступа', async () => {
    const row = { userId: '123', firstName: 'Иван' };
    mocks.query.mockResolvedValueOnce({ rows: [{ total: '3' }] }).mockResolvedValueOnce({ rows: [row] });
    const res = await request({ tokenId: 'token_7' }, { limit: '1', offset: '1' });
    expect(res.json).toHaveBeenCalledWith({ items: [row], count: 3, nextOffset: 2, prevOffset: 0, fromItem: 2, toItem: 2 });
    expect(mocks.token).toHaveBeenCalledExactlyOnceWith(7);
    expect(mocks.access).toHaveBeenCalledExactlyOnceWith(9, 42);
    expect(mocks.query.mock.calls[1][1]).toEqual([9, 7, 1, 1]);
  });
  it('поддерживает user_ и сохраняет данные при недоступной фотографии', async () => {
    mocks.query.mockResolvedValue({ rows: [{ userId: '123', firstName: 'Иван', registeredAt: null, lastInteraction: null }] });
    const res = await request({ tokenId: 'token_7', userId: 'user_123' });
    expect(res.json).toHaveBeenCalledWith({ userId: '123', firstName: 'Иван', registeredAt: '—', lastInteraction: '—', photoUrl: null });
    expect(mocks.query.mock.calls[0][1]).toEqual([9, 7, '123']);
    expect(mocks.access).toHaveBeenCalledTimes(1);
    expect(mocks.photo).toHaveBeenCalledTimes(1);
  });
  it('несуществующий пользователь не вызывает Telegram', async () => {
    const res = await request({ tokenId: '7', userId: '123' });
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.photo).not.toHaveBeenCalled();
  });
  it('сохраняет поддержку отрицательных идентификаторов чатов', async () => {
    await request({ tokenId: '7', userId: 'user_-100123' });
    expect(mocks.query.mock.calls[0][1]).toEqual([9, 7, '-100123']);
  });
});
