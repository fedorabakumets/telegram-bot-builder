/** @fileoverview История запусков учитывает удалённого исполнителя и неопределённость связи. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { Request, Response } from 'express';

const mocks = vi.hoisted(() => ({
  /** Хранилище с доступным проектом и экземпляром. */
  storage: {
    getBotToken: vi.fn(), hasProjectAccess: vi.fn(), getBotInstanceByToken: vi.fn(), getLaunchHistory: vi.fn(),
  },
  /** Снимок исполнителя и сверка истории. */
  actual: vi.fn(), reconcile: vi.fn(),
}));
vi.mock('../../../storages/storage', () => ({ storage: mocks.storage }));
vi.mock('../../../telegram/auth-middleware', () => ({ getOwnerIdFromRequest: () => 1 }));
vi.mock('../resolve-actual-bot-status', () => ({ resolveActualBotStatus: mocks.actual }));
vi.mock('../../../bots/reconcileLaunchHistory', () => ({ reconcileLaunchHistoryForToken: mocks.reconcile }));
import { handleGetLaunchHistory } from './botLaunchHistoryHandler';

/** Каждый тест начинает с доступного токена и пустой истории. */
beforeEach(() => {
  vi.clearAllMocks();
  mocks.storage.getBotToken.mockResolvedValue({ id: 10, projectId: 2 });
  mocks.storage.hasProjectAccess.mockResolvedValue(true);
  mocks.storage.getBotInstanceByToken.mockResolvedValue({ id: 3, status: 'running' });
  mocks.storage.getLaunchHistory.mockResolvedValue([]);
});

it.each(['unknown', 'requested', 'starting'])('не закрывает историю при состоянии %s', async (actual) => {
  mocks.actual.mockResolvedValue(actual);
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  await handleGetLaunchHistory({ params: { tokenId: '10' }, query: {} } as unknown as Request, res as unknown as Response);
  expect(mocks.reconcile).not.toHaveBeenCalled();
  expect(res.json).toHaveBeenCalledWith([]);
});

it.each([['running', true], ['stopped', false], ['error', false]])('сверяет подтверждённое состояние %s', async (actual, running) => {
  mocks.actual.mockResolvedValue(actual);
  const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };
  await handleGetLaunchHistory({ params: { tokenId: '10' }, query: {} } as unknown as Request, res as unknown as Response);
  expect(mocks.reconcile).toHaveBeenCalledWith(10, running);
});
