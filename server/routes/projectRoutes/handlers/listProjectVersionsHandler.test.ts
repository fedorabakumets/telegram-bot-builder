/** @fileoverview Проверки совместимости и валидации API страниц истории проекта. */
import { test, beforeEach, expect, vi } from 'vitest';
import type { Request, Response } from 'express';

const mocked = vi.hoisted(() => ({ list: vi.fn(), page: vi.fn(), user: vi.fn() }));
vi.mock('../../../storages/storage', () => ({ storage: {
  listProjectVersions: mocked.list, listProjectVersionsPage: mocked.page, getTelegramUser: mocked.user,
} }));
import { listProjectVersionsHandler } from './listProjectVersionsHandler';

/** Вызывает обработчик с минимальным ответом Express. */
async function request(query: object = {}, projectId = '7') {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  await listProjectVersionsHandler({ params: { id: projectId }, query } as unknown as Request,
    response as unknown as Response);
  return response;
}

beforeEach(() => { vi.resetAllMocks(); mocked.list.mockResolvedValue([]); mocked.user.mockResolvedValue(null); });

test('старый запрос возвращает массив и сохраняет отображение автора', async () => {
  mocked.list.mockResolvedValue([{ id: 1, authorId: null, authorKind: 'agent' }]);
  const response = await request();
  expect(mocked.page).not.toHaveBeenCalled();
  expect(response.json).toHaveBeenCalledWith([expect.objectContaining({ id: 1, authorName: 'ИИ-агент' })]);
});

test('запрос страницы передаёт область проекта и возвращает курсор', async () => {
  mocked.page.mockResolvedValue({ items: [], nextCursor: null, total: 0 });
  const response = await request({ limit: '20' });
  expect(mocked.page).toHaveBeenCalledWith(7, { limit: 20, cursor: undefined });
  expect(response.json).toHaveBeenCalledWith({ items: [], nextCursor: null, total: 0 });
  expect(mocked.list).not.toHaveBeenCalled();
});

test.each([{ limit: '0' }, { limit: '101' }, { limit: ['20'] }, { limit: '1.5' }, { cursor: '' },
  { cursor: 'invalid' }, { cursor: ['bad'] }])('неверный query возвращает400 до обращения в БД: %j', async (query) => {
  const response = await request(query);
  expect(response.status).toHaveBeenCalledWith(400);
  expect(mocked.page).not.toHaveBeenCalled();
  expect(mocked.list).not.toHaveBeenCalled();
});

test('курсор другого проекта отклоняется без чтения его истории', async () => {
  const cursor = Buffer.from(JSON.stringify({ projectId: 8, id: 1, timestamp: null })).toString('base64url');
  const response = await request({ cursor });
  expect(response.status).toHaveBeenCalledWith(400);
  expect(mocked.page).not.toHaveBeenCalled();
});
