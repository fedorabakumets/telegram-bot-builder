/** @fileoverview Проверка подтверждённого и ожидающего состояния удалённого бота. */

import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ inspect: vi.fn(), starting: vi.fn() }));
vi.mock('../../bots/botPlacement', () => ({ getProjectPlacement: () => ({ runnerId: 'test' }) }));
vi.mock('../../bots/remoteRunnerHub', () => ({ RemoteRunnerHub: { get: async () => ({ inspect: mocks.inspect }) } }));
vi.mock('../../bots/resolveRunnerRedisUrl', () => ({ resolveRunnerRedisUrl: () => 'redis://test' }));
vi.mock('../../bots/botStartState', () => ({ isBotStarting: mocks.starting }));
vi.mock('./compute-live-bot-status', () => ({ computeLiveBotStatus: () => 'stopped' }));

import { resolveActualBotStatus } from './resolve-actual-bot-status';

beforeEach(() => { mocks.inspect.mockReset(); mocks.starting.mockReturnValue(false); });

it('показывает работу только после подтверждения исполнителя', async () => {
  mocks.inspect.mockResolvedValue({ workers: [{ workerKey: 1, instance: 'a', tokenIds: [42] }] });
  expect(await resolveActualBotStatus(1, 42, { status: 'stopped' })).toBe('running');
});

it('показывает ожидающий запрос, когда бот ещё не запущен', async () => {
  mocks.inspect.mockResolvedValue({ workers: [] });
  expect(await resolveActualBotStatus(1, 42, { status: 'running', desiredStatus: 'running' })).toBe('requested');
  mocks.starting.mockReturnValue(true);
  expect(await resolveActualBotStatus(1, 42, { status: 'running', desiredStatus: 'running' })).toBe('starting');
});

it('показывает запуск после подтверждения приёма команды исполнителем', async () => {
  mocks.inspect.mockResolvedValue({ workers: [{ workerKey: 1, instance: 'a', tokenIds: [], pendingTokenIds: [42] }] });
  expect(await resolveActualBotStatus(1, 42, { status: 'stopped', desiredStatus: 'running' })).toBe('starting');
});

it('не объявляет остановку при недоступном исполнителе', async () => {
  mocks.inspect.mockRejectedValue(new Error('timeout'));
  expect(await resolveActualBotStatus(1, 42, { status: 'running' })).toBe('unknown');
});

it('сохраняет ошибку запуска после подтверждённого отсутствия бота', async () => {
  mocks.inspect.mockResolvedValue({ workers: [] });
  expect(await resolveActualBotStatus(1, 42, { status: 'error', desiredStatus: 'running' })).toBe('error');
});

it('не превращает завершившуюся ошибку в бесконечное ожидание запуска', async () => {
  mocks.inspect.mockResolvedValue({ workers: [] });
  expect(await resolveActualBotStatus(1, 42, { status: 'stopped', desiredStatus: 'running',
    errorMessage: 'Ошибка запуска: обработчик завершился' })).toBe('error');
  expect(await resolveActualBotStatus(1, 42, { status: 'stopped', desiredStatus: 'running',
    errorMessage: '__server_restart__' })).toBe('requested');
  mocks.starting.mockReturnValue(true);
  expect(await resolveActualBotStatus(1, 42, { status: 'stopped', desiredStatus: 'running',
    errorMessage: 'Ошибка предыдущего запуска' })).toBe('starting');
});

it('использует один снимок исполнителя для списка ботов', async () => {
  mocks.inspect.mockResolvedValue({ workers: [{ workerKey: 1, instance: 'a', tokenIds: [42], pendingTokenIds: [] }] });
  const cache = new Map();
  expect(await resolveActualBotStatus(1, 42, { status: 'stopped' }, false, cache)).toBe('running');
  expect(await resolveActualBotStatus(1, 43, { status: 'stopped' }, false, cache)).toBe('stopped');
  expect(mocks.inspect).toHaveBeenCalledTimes(1);
});
