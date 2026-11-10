/** @fileoverview Проверяет подавление повторных запросов и классификацию отказов Telegram. */
import { beforeEach, expect, it, vi } from 'vitest';
/** Изолированные зависимости транспорта и записи статуса. */
const mocks = vi.hoisted(() => ({ fetch: vi.fn(), mark: vi.fn() }));
vi.mock('../utils/telegram-proxy', () => ({ fetchWithProxy: mocks.fetch }));
vi.mock('../utils/telegram-api-url', () => ({ getTelegramApiBaseUrl: () => 'https://api.example' }));
vi.mock('../bots/mark-bot-token-unauthorized', () => ({ markBotTokenUnauthorized: mocks.mark }));
import { createBotTokenFetch } from './bot-token-fetch';
import type { BotToken } from '@shared/schema';
/** Создаёт минимальную запись токена для проверки транспорта. */
function token(overrides: Partial<BotToken> = {}): BotToken {
  return { id: 7, projectId: 12, token: '123:secret', isActive: 1, ...overrides } as BotToken;
}
beforeEach(() => { mocks.fetch.mockReset(); mocks.mark.mockReset(); });
it('не обращается в Telegram для сохранённого недействительного токена', async () => {
  const fetch = createBotTokenFetch([token({ isActive: 0, authorizationError: 'unauthorized' })]);
  expect((await fetch('https://api.example/bot123:secret/getMe')).status).toBe(401);
  expect(mocks.fetch).not.toHaveBeenCalled();
});
it('фиксирует401 с исходным токеном и прекращает fallback запросы', async () => {
  mocks.fetch.mockResolvedValue(Response.json({}, { status: 401 }));
  const fetch = createBotTokenFetch([token()]);
  await fetch('https://api.example/bot123:secret/getMe');
  await fetch('https://api.example/bot123:secret/getUserProfilePhotos');
  expect(mocks.fetch).toHaveBeenCalledTimes(1);
  expect(mocks.mark).toHaveBeenCalledWith(12, 7, '123:secret');
});
it.each([403, 429, 500])('не отключает токен при статусе %s', async status => {
  mocks.fetch.mockResolvedValue(Response.json({}, { status }));
  const fetch = createBotTokenFetch([token()]);
  await fetch('https://api.example/bot123:secret/getMe');
  await fetch('https://api.example/bot123:secret/getMe');
  expect(mocks.fetch).toHaveBeenCalledTimes(2);
  expect(mocks.mark).not.toHaveBeenCalled();
});
it('не считает отказ скачивания файла или стороннего сервера недействительным токеном', async () => {
  mocks.fetch.mockResolvedValue(Response.json({}, { status: 401 }));
  const fetch = createBotTokenFetch([token()]);
  await fetch('https://api.example/file/bot123:secret/photo.jpg');
  await fetch('https://other.example/bot123:secret/getMe');
  expect(mocks.mark).not.toHaveBeenCalled();
});
it('не переносит отказ старого токена на новую строку и сохраняет сетевые исключения', async () => {
  mocks.fetch.mockRejectedValueOnce(new Error('network'));
  const fetch = createBotTokenFetch([token()]);
  await expect(fetch('https://api.example/bot123:secret/getMe')).rejects.toThrow('network');
  expect(mocks.mark).not.toHaveBeenCalled();
  mocks.fetch.mockResolvedValue(Response.json({ ok: true }));
  await createBotTokenFetch([token({ token: '123:new' })])('https://api.example/bot123:new/getMe');
  expect(mocks.fetch).toHaveBeenCalledTimes(2);
});

/** Ручное отключение не выдаётся за подтверждённый отказ авторизации. */
it('сохраняет различие ручного отключения и401', async () => {
  expect((await createBotTokenFetch([token({ isActive: 0 })])('https://api.example/bot123:secret/getMe')).status).toBe(403);
  expect(mocks.fetch).not.toHaveBeenCalled();
  expect(mocks.mark).not.toHaveBeenCalled();
});
