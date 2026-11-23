/** @fileoverview Проверяет сохранение причины polling от события воркера до истории и панели. */
import { createHash } from 'node:crypto';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ history: vi.fn(), close: vi.fn(), instance: vi.fn(), mark: vi.fn(), broadcast: vi.fn() }));
vi.mock('../database/db', () => ({ db: {}, pool: {}, closeDbPool: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: {
  updateLaunchHistory: mocks.history, closeAllRunningLaunchHistory: mocks.close,
  getBotInstanceByToken: async () => ({ id: 8 }), updateBotInstance: mocks.instance,
} }));
vi.mock('./mark-bot-token-unauthorized', () => ({ markBotTokenUnauthorized: mocks.mark }));
vi.mock('./scheduleBotRestart', () => ({ scheduleBotRestart: vi.fn() }));
vi.mock('../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
import { workerManager } from './botWorkerManager';
import { handleWorkerBotExited } from './handleWorkerBotExited';
import { clearActiveLaunchId, setActiveLaunchId } from '../terminal/activeLaunchIds';

/** Доступ к закрытым коллекциям необходим только для изолированной имитации канала. */
const manager = workerManager as any;
const tokenId = 995030;
const event = { type: 'bot_runtime_error', token_id: tokenId, code: 'telegram_polling_rejected',
  source: 'telegram_bot_api', method: 'getUpdates', launch_id: 123, telegram_code: 409,
  reason: 'polling_conflict', tokenFingerprint: createHash('sha256').update('test-secret').digest('hex') };

beforeEach(() => {
  vi.clearAllMocks();
  manager.tokenProjects.set(tokenId, 10);
  manager.projectWorkerKeys.set(10, 0);
  manager.startArgs.set(tokenId, { token: 'test-secret' });
  setActiveLaunchId(tokenId, 123);
});
afterEach(() => {
  manager.tokenProjects.delete(tokenId);
  manager.projectWorkerKeys.delete(10);
  manager.startArgs.delete(tokenId);
  manager.lastBotErrors.delete(tokenId);
  manager.workerHostCrashes.delete(tokenId);
  clearActiveLaunchId(tokenId);
});

it('сохраняет точную причину в истории, экземпляре и WS, не отзывая токен', async () => {
  manager.handleWorkerMessage(0, event);
  const reason = manager.lastBotErrors.get(tokenId);
  expect(reason).toMatch(/409.*другой процесс/);
  manager.handleWorkerMessage(0, { type: 'stderr', token_id: tokenId, level: 'ERROR', content: 'Ошибка очистки' });
  manager.handleWorkerMessage(0, { type: 'worker_host_crash', token_id: tokenId, exit_code: 1, signal: null });
  let completed: Promise<void> | undefined;
  /** Передаёт событие выхода тому же обработчику, который записывает историю в приложении. */
  const listener = (...args: Parameters<typeof handleWorkerBotExited>) => { completed = handleWorkerBotExited(...args); };
  workerManager.on('bot-exited', listener);
  try {
    manager.handleSystemMessage(0, `bot_exited:${tokenId}:error`);
    expect(completed).toBeDefined();
    await completed;
    const errorMessage = `Ошибка выполнения: ${reason}`;
    expect(mocks.history).toHaveBeenCalledWith(123, expect.objectContaining({ status: 'error', errorMessage }));
    expect(mocks.close).toHaveBeenCalledWith(tokenId, expect.objectContaining({ errorMessage }));
    expect(mocks.instance).toHaveBeenCalledWith(8, expect.objectContaining({ errorMessage }));
    expect(mocks.broadcast).toHaveBeenCalledWith(10, expect.objectContaining({ data: { exitStatus: 'error', errorMessage } }));
    expect(mocks.mark).not.toHaveBeenCalled();
  } finally { workerManager.off('bot-exited', listener); }
});

it('не принимает отказ другой группы, старого запуска или заменённого секрета', () => {
  manager.handleWorkerMessage(123, event);
  manager.handleWorkerMessage(0, { ...event, launch_id: 122 });
  manager.handleWorkerMessage(0, { ...event, tokenFingerprint: createHash('sha256').update('old-secret').digest('hex') });
  expect(manager.lastBotErrors.has(tokenId)).toBe(false);
  expect(mocks.mark).not.toHaveBeenCalled();
});
