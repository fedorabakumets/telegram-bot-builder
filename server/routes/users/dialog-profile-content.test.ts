/** @fileoverview Проверка доступа к сохранённым материалам и исключения опасных ссылок. */
import express, { type Request, type Response, type NextFunction } from 'express';
import { createServer } from 'node:http';
import { beforeAll, afterAll, beforeEach, it, expect, vi } from 'vitest';
import { extractProfileLinks, safeProfileLink } from '../dialogs/dialog-profile-content-links';
const mocks = vi.hoisted(() => ({ read: vi.fn(), photo: vi.fn(), getToken: vi.fn() }));
vi.mock('../dialogs/dialog-profile-content-store', () => ({ readProfileContent: mocks.read }));
vi.mock('../dialogs/dialog-profile-content-file', () => ({ serveProfilePhoto: mocks.photo }));
vi.mock('../../storages/storage', () => ({ storage: { getBotToken: mocks.getToken } }));
vi.mock('../../middleware/requireProjectAccess', () => ({
  /** Моделирует отказ доступа чужому проекту до чтения материалов. */
  requireProjectAccess: (req: Request, res: Response, next: NextFunction) => req.params.projectId === '12' ? next() : res.sendStatus(403),
}));
import { registerDialogProfileContentRoutes } from '../dialogs/dialog-profile-content-routes';
const app = express(); registerDialogProfileContentRoutes(app);
const server = createServer(app); let base = '';
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  base = `http://127.0.0.1:${(server.address() as { /** Порт тестового сервера. */ port: number }).port}/api/projects`;
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
beforeEach(() => {
  vi.clearAllMocks(); mocks.read.mockResolvedValue({ items: [], beforeId: null });
  mocks.getToken.mockResolvedValue({ id: 7, projectId: 12 });
});

it('читает общие материалы без токена по умолчанию и передаёт курсор', async () => {
  const response = await fetch(`${base}/12/dialog-profiles/15/content?beforeId=40`);
  expect(response.status).toBe(200);
  expect(response.headers.get('ratelimit-policy')).toBe('120;w=60');
  expect(mocks.read).toHaveBeenCalledWith({ projectId: 12, userId: '15', tokenId: null, isGroup: false }, 40);
  expect(mocks.getToken).not.toHaveBeenCalled();
});

it('не позволяет читать материалы и изображения чужого проекта', async () => {
  expect((await fetch(`${base}/13/dialog-profiles/15/content`)).status).toBe(403);
  const photo = await fetch(`${base}/13/dialog-profiles/15/content/media/4`);
  expect(photo.status).toBe(403);
  /** Фото расходуют собственную квоту, поскольку галерея загружает их параллельно. */
  expect(photo.headers.get('ratelimit-policy')).toBe('600;w=60');
  expect(mocks.read).not.toHaveBeenCalled(); expect(mocks.photo).not.toHaveBeenCalled();
});

it('отклоняет бота другого проекта и некорректный курсор', async () => {
  mocks.getToken.mockResolvedValue({ id: 7, projectId: 13 });
  expect((await fetch(`${base}/12/dialog-profiles/15/content?tokenId=7`)).status).toBe(400);
  expect((await fetch(`${base}/12/dialog-profiles/15/content?beforeId=-1`)).status).toBe(400);
  expect(mocks.read).not.toHaveBeenCalled();
});

it('извлекает обычные ссылки, не возвращая произвольные секретные поля метаданных', () => {
  expect(extractProfileLinks('Адрес https://example.com/a.', { token: 'hidden-token', entities: [{ type: 'text_link', url: 'https://example.org/' }],
    reply_markup: { inline_keyboard: [[{ url: 'javascript:alert(1)' }, { url: 'https://example.com/a' }]] } })).toEqual(['https://example.com/a', 'https://example.org/']);
  for (const unsafe of ['javascript:alert(1)', 'data:text/html,test', 'file:///secret', 'https://name:pass@example.com/', 'https://api.telegram.org/bot123:SECRET/getMe']) expect(safeProfileLink(unsafe)).toBeNull();
});
