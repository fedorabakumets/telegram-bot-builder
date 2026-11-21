/** @fileoverview Проверки ограниченного восстановления общего обработчика независимо от автоповторов ошибок бота. */
import { afterEach, beforeEach, expect, it, vi } from 'vitest';

/** Изолированные зависимости очереди и общего бюджета повторов. */
const mocks = vi.hoisted(() => ({
  token: { token: '700001:fake', autoRestart: 0, isActive: 1, authorizationError: null as string | null },
  instance: { id: 3, status: 'error', desiredStatus: 'running', desiredGeneration: 2,
    errorMessage: '[worker_host_crash] Общий обработчик завершился' },
  attempts: 0, revision: 0,
  start: vi.fn(), allowed: vi.fn(), update: vi.fn(),
}));
vi.mock('../storages/storage', () => ({ storage: {
  getBotToken: async () => mocks.token,
  getBotInstanceByToken: async () => ({ ...mocks.instance }),
  updateBotInstance: mocks.update,
} }));
vi.mock('./botRestartManager', () => ({
  getRestartDelay: () => mocks.attempts < 3 ? 1000 : null,
  incrementRestartCounter: () => { mocks.attempts++; },
  getRestartCounter: () => ({ attempts: mocks.attempts }),
}));
vi.mock('./botStartState', () => ({ getBotStartRevision: () => mocks.revision }));
vi.mock('./startBotAfterStop', () => ({ startBotAfterStop: mocks.start }));
vi.mock('./automaticBotStartAllowed', () => ({ automaticBotStartAllowed: mocks.allowed }));
vi.mock('./serverShutdownState', () => ({ isServerShuttingDown: () => false }));
import { scheduleBotRestart } from './scheduleBotRestart';

beforeEach(() => {
  vi.useFakeTimers();
  mocks.attempts = 0;
  mocks.revision = 0;
  mocks.token = { token: '700001:fake', autoRestart: 0, isActive: 1, authorizationError: null };
  mocks.instance = { id: 3, status: 'error', desiredStatus: 'running', desiredGeneration: 2,
    errorMessage: '[worker_host_crash] Общий обработчик завершился' };
  mocks.start.mockReset().mockResolvedValue({ success: true });
  mocks.allowed.mockReset().mockResolvedValue(true);
  mocks.update.mockReset();
});
afterEach(() => vi.useRealTimers());

/** Исключение для инфраструктуры не меняет политику ошибок отдельного бота. */
it('восстанавливает инфраструктуру при выключенном автоперезапуске, обычную ошибку пропускает', async () => {
  await scheduleBotRestart(7, 42, 'bot error');
  expect(mocks.attempts).toBe(0);
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  await vi.runAllTimersAsync();
  expect(mocks.start).toHaveBeenCalledTimes(1);
});

/** Резервная сверка не создаёт вторую попытку поверх уже ожидающей. */
it('объединяет немедленное восстановление и резервную сверку', async () => {
  await Promise.all([scheduleBotRestart(7, 42, 'host crash', { infrastructure: true }),
    scheduleBotRestart(7, 42, 'host crash', { infrastructure: true })]);
  await vi.runAllTimersAsync();
  expect(mocks.attempts).toBe(1);
  expect(mocks.start).toHaveBeenCalledTimes(1);
});

/** Неудачная попытка до появления нового события выхода тоже расходует общий бюджет. */
it('останавливает повторы после трёх неудачных запусков', async () => {
  mocks.start.mockResolvedValue({ success: false, error: 'Группа обработчика недоступна' });
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  await vi.runAllTimersAsync();
  expect(mocks.start).toHaveBeenCalledTimes(3);
  expect(mocks.update).toHaveBeenCalledWith(3, { status: 'error', errorMessage: 'Автоперезапуск исчерпан (3 попыток)' });
});

/** Вместимость не исправляется расходованием бюджета автоматических перезапусков. */
it('не планирует инфраструктурный повтор уже сохранённого отказа памяти', async () => {
  mocks.instance.errorMessage = '[runner_memory] Недостаточно памяти';
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  await vi.runAllTimersAsync();
  expect(mocks.attempts).toBe(0);
  expect(mocks.start).not.toHaveBeenCalled();
});

/** Отказ во время восстановления терминален до явного действия пользователя. */
it('не повторяет старт после результата memory refusal даже для инфраструктуры', async () => {
  mocks.start.mockResolvedValue({ success: false, error: '[runner_memory] Недостаточно памяти' });
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  await vi.runAllTimersAsync();
  expect(mocks.attempts).toBe(1);
  expect(mocks.start).toHaveBeenCalledTimes(1);
  expect(mocks.update).not.toHaveBeenCalled();
});

/** Ошибка допуска, возникшая в период ожидания, отменяет уже существующий таймер. */
it('отменяет отложенный старт после сохранения memory refusal', async () => {
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  mocks.instance.errorMessage = '[runner_memory] Недостаточно памяти';
  await vi.runAllTimersAsync();
  expect(mocks.start).not.toHaveBeenCalled();
});

/** Отзыв токена в период ожидания отменяет восстановление. */
it('не запускает токен, отозванный во время задержки', async () => {
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  mocks.token.authorizationError = 'unauthorized';
  await vi.runAllTimersAsync();
  expect(mocks.start).not.toHaveBeenCalled();
});

/** Новое намерение не должно быть перезаписано отложенной операцией старого поколения. */
it('отменяет попытку при смене поколения', async () => {
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  mocks.instance.desiredGeneration++;
  await vi.runAllTimersAsync();
  expect(mocks.start).not.toHaveBeenCalled();
});

/** Ручная остановка во время асинхронной проверки заморозки имеет приоритет. */
it('повторно проверяет ручную остановку после ожидания проверки доступа', async () => {
  let release!: (allowed: boolean) => void;
  mocks.allowed.mockResolvedValueOnce(true).mockImplementationOnce(() => new Promise<boolean>(resolve => { release = resolve; }));
  await scheduleBotRestart(7, 42, 'host crash', { infrastructure: true });
  await vi.advanceTimersByTimeAsync(1000);
  mocks.revision++;
  mocks.instance.desiredStatus = 'stopped';
  release(true);
  await vi.runAllTimersAsync();
  expect(mocks.start).not.toHaveBeenCalled();
});
