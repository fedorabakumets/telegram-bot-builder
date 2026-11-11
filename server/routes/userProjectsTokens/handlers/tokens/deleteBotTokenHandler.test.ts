/**
 * @fileoverview Проверка безопасного удаления токена через API бота
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const mocks = vi.hoisted(() => ({ stop: vi.fn(), remove: vi.fn(), broadcast: vi.fn(), desiredStatus: vi.fn(), instance: vi.fn() }));
vi.mock('../../../../bots/stopBot', () => ({ stopBot: mocks.stop }));
vi.mock('../../../../bots/setBotDesiredStatus', () => ({ setBotDesiredStatus: mocks.desiredStatus }));
vi.mock('../../../../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
vi.mock('../../../../middleware/bot-api-actor', () => ({ getBotActorId: () => 123 }));
vi.mock('../../../../storages/storage', () => ({ storage: {
  getBotToken: vi.fn().mockResolvedValue({ projectId: 12, name: 'Бот' }),
  hasProjectAccess: vi.fn().mockResolvedValue(true), deleteBotToken: mocks.remove,
  getBotInstanceByToken: mocks.instance,
} }));
import { deleteBotTokenHandler } from './deleteBotTokenHandler';

/** Создаёт ответ для проверки состояния и тела.
 * @returns Ответ с записываемым состоянием и телом.
 */
function response() {
  const result = {
    statusCode: 200, body: undefined as unknown,
    /** Сохраняет код ответа. */
    status(code: number) { this.statusCode = code; return this; },
    /** Сохраняет тело ответа. */
    json(body: unknown) { this.body = body; return this; },
  };
  return result;
}

describe('Удаление токена через API бота', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.broadcast.mockResolvedValue(undefined);
    mocks.instance.mockResolvedValue({ id: 81 });
    mocks.desiredStatus.mockResolvedValue(undefined);
  });
  it('не удаляет токен без подтверждения остановки', async () => {
    mocks.stop.mockResolvedValue({ success: false });
    const res = response();
    await deleteBotTokenHandler({ params: { tokenId: '40' } } as unknown as Request, res as unknown as Response);
    expect(res.statusCode).toBe(409);
    expect(mocks.desiredStatus).toHaveBeenCalledWith(81, 'stopped');
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('удаляет токен после подтверждения остановки', async () => {
    mocks.stop.mockResolvedValue({ success: true }); mocks.remove.mockResolvedValue(true);
    const res = response();
    await deleteBotTokenHandler({ params: { tokenId: '40' } } as unknown as Request, res as unknown as Response);
    expect(mocks.stop).toHaveBeenCalledWith(12, 40);
    expect(mocks.desiredStatus).toHaveBeenCalledWith(81, 'stopped');
    expect(mocks.desiredStatus.mock.invocationCallOrder[0]).toBeLessThan(mocks.stop.mock.invocationCallOrder[0]);
    expect(mocks.remove).toHaveBeenCalledWith(40);
    expect(res.body).toEqual({ success: true });
  });
  it('удаляет токен без зарегистрированного экземпляра после проверки остановки', async () => {
    mocks.instance.mockResolvedValue(undefined);
    mocks.stop.mockResolvedValue({ success: true }); mocks.remove.mockResolvedValue(true);
    const res = response();
    await deleteBotTokenHandler({ params: { tokenId: '40' } } as unknown as Request, res as unknown as Response);
    expect(mocks.desiredStatus).not.toHaveBeenCalled();
    expect(mocks.stop).toHaveBeenCalledWith(12, 40);
    expect(mocks.remove).toHaveBeenCalledWith(40);
  });
});
