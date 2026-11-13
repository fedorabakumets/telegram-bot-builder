/** @fileoverview Заморозка останавливает только подтверждённую версию текущего запуска. */
import { createHash } from 'node:crypto';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), launch: vi.fn(), stop: vi.fn(), record: vi.fn(), bind: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: { getBotToken: mocks.get } }));
vi.mock('../terminal/activeLaunchIds', () => ({ getActiveLaunchId: mocks.launch }));
vi.mock('./frozenBotStatus', () => ({ recordFrozenBotError: mocks.record, bindFrozenBotIdentity: mocks.bind }));
vi.mock('./frozenAutoStop', () => ({ scheduleFrozenBotStop: mocks.stop, confirmFrozenBotStop: mocks.stop }));
vi.mock('./mark-bot-token-unauthorized', () => ({ markBotTokenUnauthorized: vi.fn() }));
import { handleRuntimeTokenFrozen, handleProcessTokenFrozen } from './handle-runtime-token-frozen';

/** Подтверждённый отказ Telegram от конкретной версии токена. */
const event = {
  type: 'bot_runtime_error', code: 'telegram_frozen', source: 'telegram_bot_api', method: 'getUpdates',
  launch_id: 9,
  tokenFingerprint: createHash('sha256').update('123:old').digest('hex'),
};
/** Каждый тест получает работающий запуск номер 9. */
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ projectId: 2, token: '123:old' });
  mocks.launch.mockReturnValue(9);
  mocks.stop.mockResolvedValue(true);
});
it('делегирует только подтверждённый текущий запуск', async () => {
  await handleRuntimeTokenFrozen(2, 4, event, 9);
  expect(mocks.stop).toHaveBeenCalledWith({ projectId: 2, tokenId: 4, launchId: 9, expectedToken: '123:old' });
});
it('не останавливает токен после ротации секрета', async () => {
  mocks.get.mockResolvedValue({ projectId: 2, token: '123:new' });
  await handleRuntimeTokenFrozen(2, 4, event, 9);
  expect(mocks.stop).not.toHaveBeenCalled();
  expect(mocks.record).not.toHaveBeenCalled();
});
it('не останавливает новый запуск после ожидания БД', async () => {
  mocks.get.mockImplementation(async () => { mocks.launch.mockReturnValue(10); return { projectId: 2, token: '123:old' }; });
  await handleRuntimeTokenFrozen(2, 4, event, 9);
  expect(mocks.stop).not.toHaveBeenCalled();
});
it('не доверяет похожей ошибке стороннего сервиса', async () => {
  await handleRuntimeTokenFrozen(2, 4, { ...event, source: 'other' }, 9);
  expect(mocks.stop).not.toHaveBeenCalled();
});
it('не принимает событие без личности запуска или от старого запуска', async () => {
  await handleRuntimeTokenFrozen(2, 4, { ...event, launch_id: undefined }, 9);
  await handleRuntimeTokenFrozen(2, 4, { ...event, launch_id: 8 }, 9);
  expect(mocks.stop).not.toHaveBeenCalled();
});
it('проверяет старый токен и запуск отдельного Python', async () => {
  await handleProcessTokenFrozen(2, 4, '123:old', 9);
  expect(mocks.stop).toHaveBeenCalledTimes(1);
  mocks.stop.mockClear();
  await handleProcessTokenFrozen(2, 4, '123:replaced', 9);
  await handleProcessTokenFrozen(2, 4, '123:old', 8);
  expect(mocks.stop).not.toHaveBeenCalled();
});
it('ожидает сохранение намерения до разрешения выхода процесса', async () => {
  let confirm!: (value: boolean) => void;
  mocks.stop.mockReturnValue(new Promise<boolean>((resolve) => { confirm = resolve; }));
  let finished = false;
  const result = handleRuntimeTokenFrozen(2, 4, event, 9).then(() => { finished = true; });
  await vi.waitFor(() => expect(mocks.stop).toHaveBeenCalled());
  expect(finished).toBe(false);
  confirm(true);
  await result;
  expect(finished).toBe(true);
});
