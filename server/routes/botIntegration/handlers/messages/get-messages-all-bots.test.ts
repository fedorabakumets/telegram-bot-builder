/** @fileoverview Проверка явного общего чтения истории без переключения на бота по умолчанию. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const mocks = vi.hoisted(() => ({ getBotToken: vi.fn(), getDefaultBotToken: vi.fn(),
  getBotMessagesWithMedia: vi.fn(), history: vi.fn(), count: vi.fn(), context: vi.fn() }));
vi.mock('../../../../storages/storage', () => ({ storage: mocks }));
vi.mock('../../../utils/resolve-request-token', () => ({ getRequestTokenId: (req: Request) => Number(req.query.tokenId) || null }));
vi.mock('../../../dialogs/user-dialog-history', () => ({ getUserDialogHistory: mocks.history }));
vi.mock('./dialog-message-count', () => ({ getDialogMessageCount: mocks.count }));
vi.mock('./get-message-context', () => ({ getMessageContext: mocks.context }));
import { getMessagesHandler } from './getMessagesHandler';

/** Создаёт ответ Express без сетевого сервера. */
function response() {
  const res = { status: vi.fn(), json: vi.fn(), set: vi.fn() };
  res.status.mockReturnValue(res);
  return res;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.history.mockResolvedValue([{ id: 1, tokenId: 7 }, { id: 2, tokenId: 8 }]);
  mocks.count.mockResolvedValue(2);
});

it('читает всю историю только при явном флаге, сохраняя курсор и приватную область', async () => {
  const res = response();
  await getMessagesHandler({ params: { projectId: '12', userId: '15' }, query: { allBots: 'true', beforeId: '30' } } as unknown as Request, res as unknown as Response);
  expect(mocks.getDefaultBotToken).not.toHaveBeenCalled();
  expect(mocks.history).toHaveBeenCalledWith(12, null, '15', 100, undefined, 30, false);
  expect(mocks.count).toHaveBeenCalledWith(12, null, '15', false, false);
  expect(res.json).toHaveBeenCalledWith([{ id: 1, tokenId: 7 }, { id: 2, tokenId: 8 }]);
});

it('передаёт общую область поиску контекста и явно разрешает собственные групповые сообщения', async () => {
  mocks.context.mockResolvedValue([{ id: 25, tokenId: 8 }]);
  const res = response();
  await getMessagesHandler({ params: { projectId: '12', userId: '15' }, query: { allBots: 'true', aroundMessageId: '25', includeGroupContext: 'true' } } as unknown as Request, res as unknown as Response);
  expect(mocks.context).toHaveBeenCalledWith(12, null, '15', 25, false, true);
  expect(mocks.history).not.toHaveBeenCalled();
});

it('отклоняет смешанную область всех ботов и явного токена', async () => {
  const res = response();
  await getMessagesHandler({ params: { projectId: '12', userId: '15' }, query: { allBots: 'true', tokenId: '7' } } as unknown as Request, res as unknown as Response);
  expect(res.status).toHaveBeenCalledWith(400);
  expect(mocks.history).not.toHaveBeenCalled();
});

it('не позволяет прочитать токен другого проекта', async () => {
  mocks.getBotToken.mockResolvedValue({ id: 7, projectId: 13 });
  const res = response();
  await getMessagesHandler({ params: { projectId: '12', userId: '15' }, query: { tokenId: '7' } } as unknown as Request, res as unknown as Response);
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.history).not.toHaveBeenCalled();
});
