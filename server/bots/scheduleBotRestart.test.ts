/** @fileoverview Проверка запрета автоматического перезапуска явно остановленного бота. */

import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  getBotToken: vi.fn(), getBotInstanceByToken: vi.fn(), getRestartDelay: vi.fn(), start: vi.fn(),
}));
vi.mock('../storages/storage', () => ({ storage: {
  getBotToken: mocks.getBotToken, getBotInstanceByToken: mocks.getBotInstanceByToken,
} }));
vi.mock('./botRestartManager', () => ({
  getRestartDelay: mocks.getRestartDelay, incrementRestartCounter: vi.fn(), getRestartCounter: vi.fn(),
}));
vi.mock('./startBotAfterStop', () => ({ startBotAfterStop: mocks.start }));
vi.mock('./botStartState', () => ({ getBotStartRevision: () => 0 }));

import { scheduleBotRestart } from './scheduleBotRestart';

beforeEach(() => {
  mocks.getBotToken.mockReset().mockResolvedValue({ autoRestart: 1, isActive: 1 });
  mocks.getBotInstanceByToken.mockReset().mockResolvedValue({ desiredStatus: 'stopped', desiredGeneration: 2 });
  mocks.getRestartDelay.mockReset().mockReturnValue(1000);
  mocks.start.mockReset();
});

it('не планирует повторный запуск после явной остановки', async () => {
  await scheduleBotRestart(7, 42, 'worker exit');
  expect(mocks.getRestartDelay).not.toHaveBeenCalled();
  expect(mocks.start).not.toHaveBeenCalled();
});
