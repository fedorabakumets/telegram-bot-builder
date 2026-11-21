/** @fileoverview Проверка доверенного восстановления общего обработчика с сохранением запретов остановки. */
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ restart: vi.fn(), close: vi.fn(), update: vi.fn(), broadcast: vi.fn(), expected: false, shutting: false }));
vi.mock('../storages/storage', () => ({ storage: {
  closeAllRunningLaunchHistory: mocks.close, getBotInstanceByToken: async () => ({ id: 8 }), updateBotInstance: mocks.update,
} }));
vi.mock('../terminal/broadcastProjectEvent', () => ({ broadcastProjectEvent: mocks.broadcast }));
vi.mock('../terminal/activeLaunchIds', () => ({ getActiveLaunchId: () => undefined, clearActiveLaunchId: vi.fn() }));
vi.mock('./mark-bot-token-unauthorized', () => ({ markBotTokenUnauthorized: vi.fn() }));
vi.mock('./scheduleBotRestart', () => ({ scheduleBotRestart: mocks.restart }));
vi.mock('./expectedStops', () => ({ isExpectedStop: () => mocks.expected }));
vi.mock('./serverShutdownState', () => ({ isServerShuttingDown: () => mocks.shutting }));
import { handleWorkerBotExited } from './handleWorkerBotExited';
import { HOST_CRASH_PREFIX } from './workerExitDiagnostic';
import { MEMORY_REFUSAL_REASON } from './workerMemoryRefusal';

const crash = `${HOST_CRASH_PREFIX}Общий обработчик завершился: code=null, signal=SIGKILL`;
beforeEach(() => {
  vi.clearAllMocks(); mocks.expected = false; mocks.shutting = false;
  mocks.close.mockResolvedValue(undefined); mocks.update.mockResolvedValue(undefined);
});

it('передаёт доверенную общую аварию в инфраструктурное восстановление и сохраняет причину', async () => {
  await handleWorkerBotExited(9, 5, 'error', crash, true);
  expect(mocks.restart).toHaveBeenCalledWith(9, 5, 'error', { infrastructure: true });
  expect(mocks.update).toHaveBeenCalledWith(8, expect.objectContaining({ errorMessage: crash }));
  expect(mocks.broadcast).toHaveBeenCalledWith(9, expect.objectContaining({
    type: 'bot-error', data: { exitStatus: 'error', errorMessage: crash },
  }));
});

it('не обходит пользовательскую настройку повтора при поддельном stderr', async () => {
  await handleWorkerBotExited(9, 5, 'error', crash, false);
  expect(mocks.restart).toHaveBeenCalledWith(9, 5, 'error', { infrastructure: false });
});

it('не восстанавливает общий обработчик после ручной остановки', async () => {
  mocks.expected = true;
  await handleWorkerBotExited(9, 5, 'error', crash, true);
  expect(mocks.restart).not.toHaveBeenCalled();
});

it('не восстанавливает общий обработчик при выключении сервера', async () => {
  mocks.shutting = true;
  await handleWorkerBotExited(9, 5, 'error', crash, true);
  expect(mocks.restart).not.toHaveBeenCalled();
});

it('не использует обычную ошибку бота как разрешение инфраструктурного восстановления', async () => {
  await handleWorkerBotExited(9, 5, 'error', 'ValueError: неверное значение', false);
  expect(mocks.restart).toHaveBeenCalledWith(9, 5, 'error', { infrastructure: false });
});

it('сохраняет отказ вместимости и не ставит запуск в автоматический повтор', async () => {
  await handleWorkerBotExited(12, 45, 'error', MEMORY_REFUSAL_REASON, false);
  expect(mocks.restart).not.toHaveBeenCalled();
  expect(mocks.update).toHaveBeenCalledWith(8, expect.objectContaining({
    errorMessage: expect.stringContaining('[runner_memory]'),
  }));
});
