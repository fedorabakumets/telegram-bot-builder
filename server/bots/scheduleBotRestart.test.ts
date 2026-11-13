/** @fileoverview Проверка запрета автоматического перезапуска явно остановленного бота. */

import { afterEach, beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getBotToken: vi.fn(), getBotInstanceByToken: vi.fn(), getRestartDelay: vi.fn(), start: vi.fn(),
  frozen: false,
}));
vi.mock('../storages/storage', () => ({ storage: {
  getBotToken: mocks.getBotToken, getBotInstanceByToken: mocks.getBotInstanceByToken,
} }));
vi.mock('./botRestartManager', () => ({
  getRestartDelay: mocks.getRestartDelay, incrementRestartCounter: vi.fn(), getRestartCounter: vi.fn(),
}));
vi.mock('./startBotAfterStop', () => ({ startBotAfterStop: mocks.start }));
vi.mock('./botStartState', () => ({ getBotStartRevision: () => 0 }));
vi.mock('./frozenBotStatus', () => ({ isBotFrozen: () => mocks.frozen }));

import { scheduleBotRestart } from './scheduleBotRestart';

beforeEach(() => {
  mocks.frozen = false;
  mocks.getBotToken.mockReset().mockResolvedValue({ token: '700001:fake', autoRestart: 1, isActive: 1 });
  mocks.getBotInstanceByToken.mockReset().mockResolvedValue({ desiredStatus: 'stopped', desiredGeneration: 2 });
  mocks.getRestartDelay.mockReset().mockReturnValue(1000);
  mocks.start.mockReset().mockResolvedValue({ success: true });
});
afterEach(() => vi.useRealTimers());

it('не планирует повторный запуск после явной остановки', async () => {
  await scheduleBotRestart(7, 42, 'worker exit');
  expect(mocks.getRestartDelay).not.toHaveBeenCalled();
  expect(mocks.start).not.toHaveBeenCalled();
});

it('не планирует backoff для подтверждённо замороженного бота', async () => {
  mocks.frozen = true;
  mocks.getBotInstanceByToken.mockResolvedValue({ desiredStatus: 'running', desiredGeneration: 2 });
  await scheduleBotRestart(7, 42, 'worker exit');
  expect(mocks.getRestartDelay).not.toHaveBeenCalled();
  expect(mocks.start).not.toHaveBeenCalled();
});

it('отменяет ранее запланированный backoff, если заморозка подтверждена во время ожидания', async () => {
  vi.useFakeTimers();
  mocks.getBotInstanceByToken.mockResolvedValue({ desiredStatus: 'running', desiredGeneration: 2 });
  await scheduleBotRestart(7, 42, 'worker exit');
  expect(mocks.getRestartDelay).toHaveBeenCalled();
  mocks.frozen = true;
  await vi.runAllTimersAsync();
  expect(mocks.start).not.toHaveBeenCalled();
});

it('после задержки запускает обычного бота без подтверждённой заморозки', async () => {
  vi.useFakeTimers();
  mocks.getBotInstanceByToken.mockResolvedValue({ desiredStatus: 'running', desiredGeneration: 2 });
  await scheduleBotRestart(7, 42, 'worker exit');
  await vi.runAllTimersAsync();
  expect(mocks.start).toHaveBeenCalledWith(7, '700001:fake', 42, false);
});
