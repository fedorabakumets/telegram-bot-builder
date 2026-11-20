/** @fileoverview Проверка прав, общей области профиля и исключения секретов из ответа списка ботов. */
import express from 'express';
import { createServer } from 'node:http';
import type { Request, Response, NextFunction } from 'express';
import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ query: vi.fn(), enrich: vi.fn() }));
vi.mock('../../database/db', () => ({ pool: { query: mocks.query } }));
vi.mock('../dialogs/enrich-dialog-bots', () => ({ enrichDialogBotMemberships: mocks.enrich }));
vi.mock('../../middleware/requireProjectAccess', () => ({
  /** Отдельный проект моделирует отказ прав до любых запросов профиля. */
  requireProjectAccess: (req: Request, res: Response, next: NextFunction) => req.params.projectId === '12' ? next() : res.sendStatus(403),
}));
import { registerDialogProfileBotsRoutes } from '../dialogs/dialog-profile-bots-routes';
const app = express(); registerDialogProfileBotsRoutes(app);
const server = createServer(app); let base = '';
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { /** Локальный порт теста. */ port: number }).port}/api/projects`;
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.enrich.mockResolvedValue([{ userId: '101', botMemberships: [
    { tokenId: 11, name: 'Первый', username: 'first_bot', status: 'Активен', incomingMessageCount: 1, buttonClickCount: 2,
      isActive: true, isBlocked: false, isDeleted: false, userData: { secret: 'private-value' }, token: 'hidden-token' },
    { tokenId: 12, name: 'Второй', status: 'Пользователь заблокировал бота', incomingMessageCount: 3, buttonClickCount: 0 },
  ] }]);
  mocks.query.mockResolvedValue({ rows: [{ registeredAt: '2026-10-01', lastInteraction: '2026-11-18' }] });
});
it('читает все реальные связи независимо от фильтра и возвращает общие даты без секретов', async () => {
  const response = await fetch(`${base}/12/dialog-users/101/profile-bots?tokenId=11`);
  const data = await response.json();
  expect(response.status).toBe(200);
  /** Чтение профиля имеет квоту даже для разрешённого проекта. */
  expect(response.headers.get('ratelimit-policy')).toBe('120;w=60');
  expect(mocks.enrich).toHaveBeenCalledWith(12, [{ userId: '101' }]);
  expect(mocks.query.mock.calls[0][1]).toEqual([12, '101']);
  expect(data.botMemberships.map((bot: { /** ID бота. */ tokenId: number }) => bot.tokenId)).toEqual([11, 12]);
  expect(data).toMatchObject({ registeredAt: '2026-10-01', lastInteraction: '2026-11-18' });
  expect(JSON.stringify(data)).not.toContain('private-value'); expect(JSON.stringify(data)).not.toContain('hidden-token');
});
it('отказывает чужому проекту до чтения связей и дат', async () => {
  expect((await fetch(`${base}/13/dialog-users/101/profile-bots`)).status).toBe(403);
  expect(mocks.enrich).not.toHaveBeenCalled(); expect(mocks.query).not.toHaveBeenCalled();
});
it('не трактует группу или некорректного пользователя как личный профиль', async () => {
  expect((await fetch(`${base}/12/dialog-users/-1001/profile-bots`)).status).toBe(400);
  expect((await fetch(`${base}/12/dialog-users/bad/profile-bots`)).status).toBe(400);
  expect(mocks.enrich).not.toHaveBeenCalled();
});
