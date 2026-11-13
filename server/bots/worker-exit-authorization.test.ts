/** @fileoverview Ошибка записи истории не теряет подтверждённый отказ Telegram и не запускает повторно бота. */
import { expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ mark: vi.fn(), restart: vi.fn(), close: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: { closeAllRunningLaunchHistory: mocks.close } }));
vi.mock('../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: vi.fn() }));
vi.mock('../terminal/activeLaunchIds', () => ({ getActiveLaunchId: () => undefined, clearActiveLaunchId: vi.fn() }));
vi.mock('./mark-bot-token-unauthorized', () => ({ markBotTokenUnauthorized: mocks.mark }));
vi.mock('./scheduleBotRestart', () => ({ scheduleBotRestart: mocks.restart }));
vi.mock('./expectedStops', () => ({ isExpectedStop: () => false }));
vi.mock('./serverShutdownState', () => ({ isServerShuttingDown: () => false }));
import { handleWorkerBotExited } from './handleWorkerBotExited';

it('сохраняет причину до истории и блокирует повторный запуск даже при ошибке истории', async () => {
  mocks.close.mockRejectedValue(new Error('История недоступна'));
  mocks.mark.mockResolvedValue(undefined);
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    await handleWorkerBotExited(2, 4, 'error', 'TelegramUnauthorizedError: Unauthorized', false, 'old');
    expect(mocks.mark).toHaveBeenCalledExactlyOnceWith(2, 4, 'old');
    expect(mocks.restart).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
it('не планирует автоперезапуск при подтверждённой заморозке даже после сбоя истории', async () => {
  vi.clearAllMocks();
  mocks.close.mockRejectedValue(new Error('История недоступна'));
  const log = vi.spyOn(console, 'error').mockImplementation(() => undefined);
  try {
    await handleWorkerBotExited(2, 4, 'error', 'TelegramBadRequest: FROZEN_METHOD_INVALID', false, 'old');
    expect(mocks.mark).not.toHaveBeenCalled();
    expect(mocks.restart).not.toHaveBeenCalled();
  } finally {
    log.mockRestore();
  }
});
