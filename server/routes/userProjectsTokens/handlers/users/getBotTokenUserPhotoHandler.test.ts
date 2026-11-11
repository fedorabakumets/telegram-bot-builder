/** @fileoverview Проверки авторизованной передачи аватара через общий прокси Telegram. */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
import { getBotTokenUserPhotoHandler } from './getBotTokenUserPhotoHandler';

const mocks = vi.hoisted(() => ({ user: vi.fn(), photo: vi.fn(), stream: vi.fn() }));
vi.mock('./bot-users-access', () => ({ getBotUsersAccess: (res: Response) => res.locals.botUsersAccess }));
vi.mock('./bot-users-repository', () => ({ findBotTokenUser: mocks.user }));
vi.mock('./bot-user-photo-cache', () => ({ getBotUserPhoto: mocks.photo }));
vi.mock('../../../botIntegration/handlers/botData/telegram-file-stream', () => ({ streamTelegramFile: mocks.stream }));
const access = { projectId: 9, tokenId: 7, token: 'secret-token' };

/**
 * Создаёт запрос с проверенным контекстом либо без него.
 * @param authorized - Наличие проверки доступа
 * @param userId - Идентификатор из маршрута
 * @returns Запрос и наблюдаемый ответ
 */
function request(authorized = true, userId = 'user_123') {
  const req = { params: { tokenId: '7', userId }, query: {}, headers: {} } as unknown as Request;
  const res = {
    locals: authorized ? { botUsersAccess: access } : {}, headersSent: false,
    status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis(), destroy: vi.fn(),
  };
  return { req, res, response: res as unknown as Response };
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ userId: '123' });
  mocks.photo.mockResolvedValue({ photoFileId: 'avatar-file', photoUrl: '/api/projects/9/telegram-file' });
});

describe('Передача фотографии пользователя токена', () => {
  it('закрыт без проверенного контекста доступа', async () => {
    const { req, res, response } = request(false);
    await getBotTokenUserPhotoHandler(req, response);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.user).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('отклоняет некорректного пользователя до запросов', async () => {
    const { req, res, response } = request(true, '../1');
    await getBotTokenUserPhotoHandler(req, response);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.user).not.toHaveBeenCalled();
  });

  it('проверяет пользователя в области проекта и токена до Telegram', async () => {
    mocks.user.mockResolvedValueOnce(undefined);
    const { req, res, response } = request();
    await getBotTokenUserPhotoHandler(req, response);
    expect(mocks.user).toHaveBeenCalledWith(access, '123');
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.photo).not.toHaveBeenCalled();
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('возвращает 404 при отсутствии фотографии', async () => {
    mocks.photo.mockResolvedValueOnce({ photoFileId: null, photoUrl: null });
    const { req, res, response } = request();
    await getBotTokenUserPhotoHandler(req, response);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(mocks.stream).not.toHaveBeenCalled();
  });

  it('использует общий поток с токеном исходного бота и кэшированным file_id', async () => {
    const { req, response } = request();
    await getBotTokenUserPhotoHandler(req, response);
    expect(mocks.photo).toHaveBeenCalledWith({ ...access, userId: '123' });
    expect(mocks.stream).toHaveBeenCalledWith(req, response, {
      token: access.token, fileId: 'avatar-file', maxBytes: 5 * 1024 * 1024, timeoutMs: 10_000,
    });
  });

  it('не раскрывает секрет из ошибки общего транспорта', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    mocks.stream.mockRejectedValueOnce(new Error(access.token));
    const { req, res, response } = request();
    await getBotTokenUserPhotoHandler(req, response);
    expect(res.status).toHaveBeenCalledWith(502);
    expect(JSON.stringify([log.mock.calls, res.json.mock.calls])).not.toContain(access.token);
    log.mockRestore();
  });
});
