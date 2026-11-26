/** @fileoverview Проверки ручного dev-режима без реальной БД, Redis и запуска ботов. */
import { afterEach, expect, it, vi } from 'vitest';
import { isManualDevBotStart } from './manual-dev-bot-start';

/** Любое обращение к БД в ручном режиме является ошибкой проверяемого сценария. */
const mocks = vi.hoisted(() => ({ database: vi.fn(() => { throw new Error('Недопустимое чтение БД'); }) }));
vi.mock('../storages/storage', () => ({ storage: { getAllBotInstances: mocks.database, getBotToken: mocks.database } }));
vi.mock('./remoteRunnerHub', () => ({ RemoteRunnerHub: {} }));
vi.mock('./botPlacement', () => ({ getProjectPlacement: vi.fn() }));
vi.mock('./resolveRunnerRedisUrl', () => ({ resolveRunnerRedisUrl: vi.fn() }));
vi.mock('./startBot', () => ({ startBot: vi.fn() }));
vi.mock('./stopBot', () => ({ stopBot: vi.fn() }));
vi.mock('./claimBuildLinkRetry', () => ({ claimBuildLinkRetry: vi.fn(), isBuildLinkExpired: vi.fn() }));
vi.mock('./scheduleBotRestart', () => ({ scheduleBotRestart: vi.fn() }));
vi.mock('./refuse-inactive-bot-start', () => ({ refuseInactiveBotStart: vi.fn() }));
vi.mock('./recoverMemoryWaiters', () => ({ recoverMemoryWaiters: vi.fn() }));
vi.mock('./frozenBotStatus', () => ({ isBotFrozen: vi.fn() }));
import { automaticBotStartAllowed } from './automaticBotStartAllowed';
import { reconcileBotDesiredState, scheduleRuntimeReconcile } from './runtime-reconcile';

afterEach(() => { vi.unstubAllEnvs(); vi.restoreAllMocks(); vi.useRealTimers(); });

it('ручной флаг действует только в development с явным true', () => {
  expect(isManualDevBotStart({ NODE_ENV: 'development', BOT_DEV_MANUAL_START: 'true' })).toBe(true);
  expect(isManualDevBotStart({ NODE_ENV: 'production', BOT_DEV_MANUAL_START: 'true' })).toBe(false);
  expect(isManualDevBotStart({ NODE_ENV: 'development', BOT_DEV_MANUAL_START: 'false' })).toBe(false);
  expect(isManualDevBotStart({ NODE_ENV: 'development' })).toBe(false);
});

it('ручной dev запрещает стартовую сверку, фоновые таймеры и отложенный автозапуск', async () => {
  vi.stubEnv('NODE_ENV', 'development');
  vi.stubEnv('BOT_DEV_MANUAL_START', 'true');
  vi.useFakeTimers();
  const beforeReconcile = vi.fn();
  const stop = scheduleRuntimeReconcile(1000, beforeReconcile);
  expect(vi.getTimerCount()).toBe(0);
  await vi.advanceTimersByTimeAsync(10000);
  expect(beforeReconcile).not.toHaveBeenCalled();
  expect(await reconcileBotDesiredState()).toEqual({ started: 0, stopped: 0, failed: 0 });
  expect(await automaticBotStartAllowed(9, 65)).toBe(false);
  expect(mocks.database).not.toHaveBeenCalled();
  stop();
});
