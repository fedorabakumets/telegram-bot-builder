/** @fileoverview Проверка сохранения намерения при явном перезапуске бота. */

import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ getProject: vi.fn(), getToken: vi.fn(), getInstance: vi.fn(), create: vi.fn(), desired: vi.fn(), stop: vi.fn(), start: vi.fn() }));
vi.mock('../../../storages/storage', () => ({ storage: {
  getBotProject: mocks.getProject, getBotToken: mocks.getToken,
  getBotInstanceByToken: mocks.getInstance, createBotInstance: mocks.create,
} }));
vi.mock('../../../bots/setBotDesiredStatus', () => ({ setBotDesiredStatus: mocks.desired }));
vi.mock('../../../bots/stopBot', () => ({ stopBot: mocks.stop }));
vi.mock('../../../bots/startBot', () => ({ startBot: mocks.start }));
vi.mock('../../../bots/restartTiming', () => ({ POST_STOP_COOLDOWN_MS: 1, sleepMs: async () => undefined }));

import { handleBotRestart } from './botRestartHandler';

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.getProject.mockResolvedValue({ id: 7 });
  mocks.getToken.mockResolvedValue({ id: 42, projectId: 7, token: 'secret' });
  mocks.getInstance.mockResolvedValue({ id: 11, tokenId: 42, desiredStatus: 'running', desiredGeneration: 3 });
  mocks.desired.mockResolvedValue(3);
  mocks.stop.mockResolvedValue({ success: true });
  mocks.start.mockResolvedValue({ success: true });
});

/**
 * Вызывает маршрут с минимальным ответом Express.
 * @returns Код и тело ответа
 */
async function request(): Promise<{ code: number; body: any }> {
  const result = { code: 200, body: null as any };
  const res = { status(code: number) { result.code = code; return this; }, json(body: any) { result.body = body; return this; } };
  await handleBotRestart({ params: { id: '7' }, body: { tokenId: 42 } } as any, res as any);
  return result;
}

it('записывает desired running до stop и start', async () => {
  expect((await request()).code).toBe(200);
  expect(mocks.desired).toHaveBeenCalledWith(11, 'running');
  expect(mocks.desired.mock.invocationCallOrder[0]).toBeLessThan(mocks.stop.mock.invocationCallOrder[0]);
  expect(mocks.stop.mock.invocationCallOrder[0]).toBeLessThan(mocks.start.mock.invocationCallOrder[0]);
});

it('не запускает бота после нового запроса на остановку', async () => {
  mocks.getInstance.mockResolvedValueOnce({ id: 11, tokenId: 42 }).mockResolvedValueOnce({ id: 11, tokenId: 42, desiredStatus: 'stopped', desiredGeneration: 4 });
  expect((await request()).code).toBe(409);
  expect(mocks.start).not.toHaveBeenCalled();
});
