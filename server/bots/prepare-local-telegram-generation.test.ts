/** @fileoverview Проверяет смену локального поколения без процессов, БД и Telegram. */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { prepareLocalTelegramRunnerGeneration } from './prepare-local-telegram-generation';

/** Подменённые зависимости жизненного цикла. */
const mocks = vi.hoisted(() => ({ mode: vi.fn(), runtime: vi.fn(), account: vi.fn(), instance: vi.fn(),
  create: vi.fn(), desired: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: { getBotInstanceByToken: mocks.instance, createBotInstance: mocks.create } }));
vi.mock('../runtime/bot-runtime-mode', () => ({ resolveBotRuntimeMode: mocks.mode }));
vi.mock('./workerRuntime', () => ({ getWorkerRuntime: mocks.runtime }));
vi.mock('./setBotDesiredStatus', () => ({ setBotDesiredStatus: mocks.desired }));
vi.mock('../database/project-telegram-accounts-store', () => ({ getProjectTelegramAccountIdForBot: mocks.account }));

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubEnv('PROJECT_TELEGRAM_ACCOUNTS_ENABLED', '1');
  mocks.mode.mockReturnValue('combined');
  mocks.runtime.mockReturnValue('local');
  mocks.account.mockResolvedValue(81);
});
afterEach(() => vi.unstubAllEnvs());

describe('Поколение локального общего аккаунта', () => {
  it('меняет поколение существующего локального экземпляра атомарно', async () => {
    mocks.instance.mockResolvedValue({ id: 11, desiredGeneration: 7 });
    mocks.desired.mockResolvedValue(8);
    await prepareLocalTelegramRunnerGeneration(9, 5, 'synthetic');
    expect(mocks.desired).toHaveBeenCalledWith(11, 'running', 7);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('создаёт первое поколение до сборки окружения', async () => {
    await prepareLocalTelegramRunnerGeneration(9, 5, 'synthetic');
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ desiredGeneration: 1, tokenId: 5 }));
  });
  it('не увеличивает повторно удалённое поколение и не затрагивает legacy бота', async () => {
    mocks.mode.mockReturnValueOnce('api');
    await prepareLocalTelegramRunnerGeneration(9, 5, 'synthetic');
    mocks.runtime.mockReturnValueOnce('remote');
    await prepareLocalTelegramRunnerGeneration(9, 5, 'synthetic');
    mocks.account.mockResolvedValueOnce(undefined);
    await prepareLocalTelegramRunnerGeneration(9, 5, 'synthetic');
    expect(mocks.desired).not.toHaveBeenCalled();
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it('прекращает запуск при конкурентном изменении поколения', async () => {
    mocks.instance.mockResolvedValue({ id: 11, desiredGeneration: 7 });
    mocks.desired.mockResolvedValue(null);
    await expect(prepareLocalTelegramRunnerGeneration(9, 5, 'synthetic')).rejects.toThrow('более новым намерением');
  });
});
