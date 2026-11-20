/** @fileoverview Настоящие HTTP-проверки доступа, валидации и чтения истории без запуска Telegram. */
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import { createServer } from 'node:http';
const mocks = vi.hoisted(() => ({ list: vi.fn(), get: vi.fn(), access: vi.fn(), telegram: vi.fn(), remove: vi.fn() }));
vi.mock('../check-history/schedule-store', () => ({ checkScheduleStore: {} }));
vi.mock('../check-history/delete-history', () => ({ deleteCheckHistory: mocks.remove }));
vi.mock('../check-history/repository', () => ({ listCheckHistory: mocks.list, getCheckHistory: mocks.get }));
vi.mock('../../storages/storage', () => ({ storage: { hasProjectAccess: mocks.access } }));
vi.mock('../../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: (req: { headers: Record<string, string> }) => req.headers['x-test-owner'] ? Number(req.headers['x-test-owner']) : null }));
vi.mock('./check-telegram-bots', () => ({ checkTelegramBots: mocks.telegram }));
import { registerCheckHistoryRoutes } from '../check-history/routes';
const app = express();
registerCheckHistoryRoutes(app);
const server = createServer(app);
let base = '';
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();
  base = `http://127.0.0.1:${typeof address === 'object' ? address!.port : 0}/api/projects`;
});
beforeEach(() => {
  vi.clearAllMocks();
  mocks.access.mockImplementation(async (project: number, owner: number) => project === 12 && owner === 1);
  mocks.list.mockResolvedValue({ items: [], nextCursor: null });
  mocks.get.mockResolvedValue(null);
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
/** Выполняет только чтение, задавая личность тестового владельца. @param path - Путь проекта. @param owner - Владелец. @returns HTTP-ответ. */
function read(path: string, owner: number | null = 1) {
  return fetch(`${base}/${path}`, { headers: owner === null ? {} : { 'x-test-owner': String(owner) } });
}
/** Проверка доступа предшествует чтению данных истории. */
it('закрывает историю без личности и для чужого проекта', async () => {
  expect((await read('12/check-history', null)).status).toBe(403);
  expect((await read('13/check-history')).status).toBe(403);
  expect((await read('12/check-history/telegram-bots:1', 2)).status).toBe(403);
  expect(mocks.list).not.toHaveBeenCalled(); expect(mocks.get).not.toHaveBeenCalled();
});
/** Неверные параметры не передаются в репозиторий и не приводятся к частичным числам. */
it.each(['limit=0', 'limit=51', 'limit=1x', 'limit=1.5', 'kind=other', 'tokenId=0', 'tokenId=9x', 'cursor=bad'])('отклоняет параметр %s', async query => {
  expect((await read(`12/check-history?${query}`)).status).toBe(400);
  expect(mocks.list).not.toHaveBeenCalled();
});
/** Запрос списка остаётся чтением: Telegram не вызывается, область передаётся явно. */
it('читает ограниченную страницу заданного проекта и вида', async () => {
  const page = { items: [{ id: 'telegram-bots:3', kind: 'telegram-bots', status: 'completed' }], nextCursor: null };
  mocks.list.mockResolvedValue(page);
  const response = await read('12/check-history?kind=telegram-bots&tokenId=9&limit=10');
  expect(response.status).toBe(200); expect(await response.json()).toEqual(page);
  expect(mocks.list).toHaveBeenCalledWith(12, expect.objectContaining({ kind: 'telegram-bots', tokenId: 9, limit: 10 }));
  expect(mocks.telegram).not.toHaveBeenCalled();
});
/** Отсутствующий запуск чужой области не раскрывается через детальный маршрут. */
it('возвращает 404 для отсутствующего запуска и подробности для найденного', async () => {
  expect((await read('12/check-history/telegram-bots:7')).status).toBe(404);
  const detail = { id: 'telegram-bots:7', kind: 'telegram-bots', items: [{ tokenId: 9, reason: 'timeout' }] };
  mocks.get.mockResolvedValue(detail);
  const response = await read('12/check-history/telegram-bots:7');
  expect(response.status).toBe(200); expect(JSON.stringify(await response.json())).toContain('timeout');
  expect(mocks.get).toHaveBeenLastCalledWith(12, 'telegram-bots:7');
  expect(mocks.telegram).not.toHaveBeenCalled();
});
/** Неизвестные формы идентификатора отвергаются до чтения базы. */
it.each(['telegram-bots:0', 'telegram-bots:1x', 'other:1'])('отклоняет идентификатор %s', async id => {
  expect((await read(`12/check-history/${id}`)).status).toBe(400);
  expect(mocks.get).not.toHaveBeenCalled();
});

/** Очистка требует доступа и явной области, не касается других проектов. */
it('проверяет доступ и область удаления истории', async () => {
  const remove = (path: string, owner = '1') => fetch(`${base}/${path}`, { method: 'DELETE', headers: { 'x-test-owner': owner } });
  expect((await remove('13/check-history?kind=private-chats')).status).toBe(403);
  expect((await remove('12/check-history')).status).toBe(400);
  expect((await remove('12/check-history?kind=unknown')).status).toBe(400);
  expect(mocks.remove).not.toHaveBeenCalled();
  mocks.remove.mockResolvedValue(2);
  const response = await remove('12/check-history?kind=private-chats&tokenId=9');
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ deleted: 2 });
  expect(mocks.remove).toHaveBeenCalledWith(12, 'private-chats', 9);
});
