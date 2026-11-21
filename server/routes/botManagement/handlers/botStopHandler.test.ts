/** @fileoverview Остановка разрешена независимо от ограничений Telegram и отключения токена. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';
const mocks = vi.hoisted(() => ({ getToken: vi.fn(), getInstance: vi.fn(), stop: vi.fn(), desired: vi.fn() }));
vi.mock('../../../storages/storage', () => ({ storage: {
  getBotToken: mocks.getToken, getBotInstanceByToken: mocks.getInstance,
} }));
vi.mock('../../../bots/stopBot', () => ({ stopBot: mocks.stop }));
vi.mock('../../../bots/setBotDesiredStatus', () => ({ setBotDesiredStatus: mocks.desired }));
import { handleBotStop } from './botStopHandler';

/** Ограничение токена не отменяет право владельца остановить его процесс. */
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getInstance.mockResolvedValue({ id: 3 });
  mocks.desired.mockResolvedValue(7);
  mocks.stop.mockResolvedValue({ success: true });
});

it.each([
  { isActive: 1, frozen: true },
  { isActive: 0, authorizationError: null },
  { isActive: 0, authorizationError: 'unauthorized' },
])('останавливает процесс при ограничениях %j', async (restriction) => {
  mocks.getToken.mockResolvedValue({ id: 10, projectId: 2, ...restriction });
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  await handleBotStop({ params: { id: '2' }, body: { tokenId: 10 } } as unknown as Request, res as unknown as Response);
  expect(mocks.desired).toHaveBeenCalledWith(3, 'stopped');
  expect(mocks.stop).toHaveBeenCalledWith(2, 10, { expectedDesiredGeneration: 7 });
  expect(res.json).toHaveBeenCalledWith({ message: 'Бот успешно остановлен' });
});

it('не отправляет остановку после исчезновения экземпляра до записи намерения', async () => {
  mocks.getToken.mockResolvedValue({ id: 10, projectId: 2 });
  mocks.desired.mockResolvedValueOnce(null);
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  await handleBotStop({ params: { id: '2' }, body: { tokenId: 10 } } as unknown as Request, res as unknown as Response);
  expect(mocks.stop).not.toHaveBeenCalled();
  expect(res.status).toHaveBeenCalledWith(409);
});
