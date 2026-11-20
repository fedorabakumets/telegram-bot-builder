/** @fileoverview Проверки ACL реального middleware и валидации маршрута групп общего профиля. */
import express from 'express';
import { createServer } from 'node:http';
import { afterAll, beforeAll, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ read: vi.fn(), access: vi.fn(), owner: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { hasProjectAccess: mocks.access } }));
vi.mock('../../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: mocks.owner }));
vi.mock('../dialogs/dialog-profile-groups-store', () => ({ getDialogProfileGroups: mocks.read }));
import { registerDialogProfileGroupsRoutes } from '../dialogs/dialog-profile-groups-routes';

const app = express();
registerDialogProfileGroupsRoutes(app);
const server = createServer(app);
let base = '';
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/projects`;
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => {
  vi.clearAllMocks(); mocks.owner.mockReturnValue(7);
  mocks.access.mockImplementation(async (projectId: number) => projectId === 12);
  mocks.read.mockResolvedValue([]);
});

it('читает только разрешённый проект и возвращает пустой список без выдуманных групп', async () => {
  const response = await fetch(`${base}/12/users/123/groups`);
  expect(response.status).toBe(200); expect(await response.json()).toEqual({ groups: [] });
  expect(response.headers.get('cache-control')).toBe('no-store');
  expect(mocks.access).toHaveBeenCalledWith(12, 7);
  expect(mocks.read).toHaveBeenCalledWith(12, '123');
});

it('не читает группы чужого проекта или без личности', async () => {
  expect((await fetch(`${base}/13/users/123/groups`)).status).toBe(403);
  mocks.owner.mockReturnValue(null);
  expect((await fetch(`${base}/12/users/123/groups`)).status).toBe(403);
  expect(mocks.read).not.toHaveBeenCalled();
});

it('отклоняет группу вместо пользователя и сообщает об ошибке чтения', async () => {
  expect((await fetch(`${base}/12/users/-1001/groups`)).status).toBe(400);
  expect(mocks.read).not.toHaveBeenCalled();
  mocks.read.mockRejectedValueOnce(new Error('database unavailable'));
  const response = await fetch(`${base}/12/users/123/groups`);
  expect(response.status).toBe(500);
  expect(await response.json()).toEqual({ message: 'Не удалось загрузить группы пользователя' });
});
