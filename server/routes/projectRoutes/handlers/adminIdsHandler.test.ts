/** @fileoverview Проверки явной очистки администраторов и чтения старого окружения. */
import type { Request, Response } from 'express';
import { beforeEach, expect, test, vi } from 'vitest';

/** Изолирует тесты от базы и файлов реально запущенных ботов. */
const mocks = vi.hoisted(() => ({ project: vi.fn(), tokens: vi.fn(), update: vi.fn(), read: vi.fn() }));
vi.mock('../../../storages/storage', () => ({ storage: {
  getBotProject: mocks.project, getBotTokensByProject: mocks.tokens, updateBotProject: mocks.update,
} }));
vi.mock('fs', () => ({ existsSync: () => true, readFileSync: mocks.read }));

import { getAdminIdsHandler, removeAdminIdHandler, updateAdminIdsHandler } from './adminIdsHandler';

/**
 * Вызывает API с фиктивным проектом.
 * @param handler - Проверяемый обработчик Express.
 * @param body - Тело запроса.
 * @returns Моки ответа.
 */
async function request(handler: (req: Request, res: Response) => Promise<void>, body?: object) {
  const response = { status: vi.fn(), json: vi.fn() };
  response.status.mockReturnValue(response);
  await handler({ params: { id: '7' }, body } as unknown as Request, response as unknown as Response);
  return response;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.project.mockResolvedValue({ adminIds: '' });
  mocks.tokens.mockResolvedValue([{ id: 4, token: 'test-token' }]);
  mocks.read.mockReturnValue('ADMIN_IDS=10,20\n');
});

test('старый проект без сохранённого значения читает администраторов из окружения', async () => {
  const response = await request(getAdminIdsHandler);
  expect(response.json).toHaveBeenCalledWith({ adminIds: '10,20', items: [{ id: '10' }, { id: '20' }], count: 2 });
});

test('явная очистка сохраняется отдельно от старого значения и возвращается как пустая строка', async () => {
  const response = await request(updateAdminIdsHandler, { adminIds: '' });
  expect(mocks.update).toHaveBeenCalledWith(7, { adminIds: ',' });
  expect(response.json).toHaveBeenCalledWith({ success: true, adminIds: '' });
  mocks.project.mockResolvedValue({ adminIds: ',' });
  const read = await request(getAdminIdsHandler);
  expect(read.json).toHaveBeenCalledWith({ adminIds: '', items: [], count: 0 });
  expect(mocks.read).not.toHaveBeenCalled();
});

test('удаление последнего ID не восстанавливает прежний список', async () => {
  mocks.project.mockResolvedValue({ adminIds: '77' });
  const response = await request(removeAdminIdHandler, { adminId: 'del_admin_77' });
  expect(mocks.update).toHaveBeenCalledWith(7, { adminIds: ',' });
  expect(response.json).toHaveBeenCalledWith({ success: true, adminIds: '' });
});

test('удаление из старого проекта переносит только оставшихся администраторов', async () => {
  const response = await request(removeAdminIdHandler, { adminId: 'del_admin_10' });
  expect(mocks.update).toHaveBeenCalledWith(7, { adminIds: '20' });
  expect(response.json).toHaveBeenCalledWith({ success: true, adminIds: '20' });
});
