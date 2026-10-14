/** @fileoverview Проверки опциональной общей истории и строгой области бота. */
import { beforeEach, expect, it, vi } from 'vitest';
import { getMessagesHandler } from '../../server/routes/botIntegration/handlers/messages/getMessagesHandler';

const mocks = vi.hoisted(() => ({ token: vi.fn(), defaultToken: vi.fn(), private: vi.fn(), history: vi.fn() }));
vi.mock('../../server/storages/storage', () => ({ storage: {
  getBotToken: mocks.token, getDefaultBotToken: mocks.defaultToken, getBotMessagesWithMedia: mocks.private,
} }));
vi.mock('../../server/routes/dialogs/user-dialog-history', () => ({ getUserDialogHistory: mocks.history }));

/**
 * Выполняет обработчик с тестовыми параметрами.
 * @param query - Параметры запроса
 * @returns Имитированный HTTP-ответ
 */
async function invoke(query: Record<string, string>) {
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  await getMessagesHandler({ params: { projectId: '12', userId: '1' }, query } as never, res as never);
  return res;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.token.mockResolvedValue({ id: 9, projectId: 12 });
  mocks.private.mockResolvedValue([{ id: 2 }, { id: 1 }]);
  mocks.history.mockResolvedValue([{ id: 1, chatType: 'private' }, { id: 3, chatType: 'supergroup' }]);
});
it('без параметра оставляет личную историю в хронологическом порядке', async () => {
  const res = await invoke({ tokenId: '9' });
  expect(mocks.private).toHaveBeenCalledWith(12, '1', 100, 'desc', undefined, 9);
  expect(mocks.history).not.toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith([{ id: 1 }, { id: 2 }]);
});
it('общая история включает только явный запрос выбранного бота', async () => {
  await invoke({ tokenId: '9', includeGroupContext: 'true', limit: '50' });
  expect(mocks.history).toHaveBeenCalledWith(12, 9, '1', 50, undefined);
  expect(mocks.private).not.toHaveBeenCalled();
});
it('чужой токен не заменяется дефолтным', async () => {
  mocks.token.mockResolvedValue({ id: 9, projectId: 13 });
  const res = await invoke({ tokenId: '9', includeGroupContext: 'true' });
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.history).not.toHaveBeenCalled();
  expect(mocks.defaultToken).not.toHaveBeenCalled();
});
it('некорректный токен не включает общую историю', async () => {
  const res = await invoke({ tokenId: 'ошибка', includeGroupContext: 'true' });
  expect(res.status).toHaveBeenCalledWith(404);
  expect(mocks.history).not.toHaveBeenCalled();
});
