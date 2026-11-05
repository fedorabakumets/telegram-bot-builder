/**
 * @fileoverview Проверка безопасного удаления токена через API бота
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const mocks = vi.hoisted(() => ({ stop: vi.fn(), remove: vi.fn(), broadcast: vi.fn() }));
vi.mock('../../../../bots/stopBot', () => ({ stopBot: mocks.stop }));
vi.mock('../../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
vi.mock('../../../../middleware/bot-api-actor', () => ({ getBotActorId: () => 123 }));
vi.mock('../../../../storages/storage', () => ({ storage: {
  getBotToken: vi.fn().mockResolvedValue({ projectId: 12, name: 'Бот' }),
  hasProjectAccess: vi.fn().mockResolvedValue(true), deleteBotToken: mocks.remove,
} }));
import { deleteBotTokenHandler } from './deleteBotTokenHandler';

/** Создаёт ответ для проверки состояния и тела. */
function response() {
  const result = { statusCode: 200, body: undefined as unknown, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } };
  return result;
}

describe('Удаление токена через API бота', () => {
  beforeEach(() => { vi.clearAllMocks(); mocks.broadcast.mockResolvedValue(undefined); });
  it('не удаляет токен без подтверждения остановки', async () => {
    mocks.stop.mockResolvedValue({ success: false });
    const res = response();
    await deleteBotTokenHandler({ params: { tokenId: '40' } } as unknown as Request, res as unknown as Response);
    expect(res.statusCode).toBe(409);
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('удаляет токен после подтверждения остановки', async () => {
    mocks.stop.mockResolvedValue({ success: true }); mocks.remove.mockResolvedValue(true);
    const res = response();
    await deleteBotTokenHandler({ params: { tokenId: '40' } } as unknown as Request, res as unknown as Response);
    expect(mocks.stop).toHaveBeenCalledWith(12, 40);
    expect(mocks.remove).toHaveBeenCalledWith(40);
    expect(res.body).toEqual({ success: true });
  });
});
