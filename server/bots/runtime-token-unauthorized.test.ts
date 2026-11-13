/** @fileoverview Структурированный отказ Telegram и ошибка отдельного Python сохраняют точную версию токена. */
import { createHash } from 'node:crypto';
import { EventEmitter } from 'node:events';
import type { ChildProcess } from 'node:child_process';
import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ get: vi.fn(), mark: vi.fn(), frozen: vi.fn() }));
vi.mock('../storages/storage', () => ({ storage: { getBotToken: mocks.get } }));
vi.mock('./mark-bot-token-unauthorized', () => ({ markBotTokenUnauthorized: mocks.mark }));
vi.mock('./handle-runtime-token-frozen', () => ({ handleProcessTokenFrozen: mocks.frozen }));
import { handleRuntimeTokenUnauthorized } from './handle-runtime-token-unauthorized';
import { observeProcessTokenUnauthorized } from './observe-process-token-unauthorized';

/** Базовый подтверждённый отказ Telegram для старой версии токена. */
const event = {
  type: 'bot_runtime_error', code: 'telegram_unauthorized', source: 'telegram_bot_api', method: 'getUpdates',
  tokenFingerprint: createHash('sha256').update('old').digest('hex'),
};
/** Каждый тест начинает с известной версии секрета. */
beforeEach(() => {
  vi.clearAllMocks();
  mocks.get.mockResolvedValue({ projectId: 2, token: 'old' });
  mocks.mark.mockResolvedValue(undefined);
  mocks.frozen.mockResolvedValue(undefined);
});
it('передаёт атомарному обновлению отвергнутую версию секрета', async () => {
  await handleRuntimeTokenUnauthorized(2, 4, event);
  expect(mocks.mark).toHaveBeenCalledWith(2, 4, 'old');
});
it('не отключает заменённый токен при запоздавшем событии', async () => {
  mocks.get.mockResolvedValue({ projectId: 2, token: 'new' });
  await handleRuntimeTokenUnauthorized(2, 4, event);
  expect(mocks.mark).not.toHaveBeenCalled();
});
it.each([{ source: 'other' }, { code: '401' }, { tokenFingerprint: 'old' }, { method: '' }])('отклоняет недостоверное событие %j', async (override) => {
  await handleRuntimeTokenUnauthorized(2, 4, { ...event, ...override });
  expect(mocks.mark).not.toHaveBeenCalled();
});
it('не обновляет токен чужого проекта', async () => {
  await handleRuntimeTokenUnauthorized(3, 4, event);
  expect(mocks.mark).not.toHaveBeenCalled();
});
it('собирает разделённый stderr, сохраняет один раз и снимает слушатель', async () => {
  const process = Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
  observeProcessTokenUnauthorized(process as unknown as ChildProcess, 2, 4, 'old');
  process.stderr.emit('data', 'TelegramUnauth');
  process.stderr.emit('data', 'orizedError: Unauthorized');
  process.stderr.emit('data', 'TelegramUnauthorizedError');
  await Promise.resolve();
  expect(mocks.mark).toHaveBeenCalledExactlyOnceWith(2, 4, 'old');
  process.emit('close');
  expect(process.stderr.listenerCount('data')).toBe(0);
});
it('не реагирует на произвольный HTTP 401 стороннего сервиса', () => {
  const process = Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
  observeProcessTokenUnauthorized(process as unknown as ChildProcess, 2, 4, 'old');
  process.stderr.emit('data', 'Unauthorized third-party API 401');
  expect(mocks.mark).not.toHaveBeenCalled();
  process.emit('close');
});
it('распознаёт разделённый код заморозки и ожидает фиксацию намерения', async () => {
  const process = Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
  let confirm!: () => void;
  mocks.frozen.mockReturnValue(new Promise<void>((resolve) => { confirm = resolve; }));
  const wait = observeProcessTokenUnauthorized(process as unknown as ChildProcess, 2, 4, 'old', 9);
  process.stderr.emit('data', 'TelegramBadRequest: Bad Request: FROZEN_METHOD_');
  process.stderr.emit('data', 'INVALID');
  expect(mocks.frozen).toHaveBeenCalledExactlyOnceWith(2, 4, 'old', 9);
  let done = false;
  const pending = wait().then(() => { done = true; });
  await Promise.resolve();
  expect(done).toBe(false);
  confirm();
  await pending;
  process.emit('close');
});
it('не останавливает отдельный Python по обычной строке журнала с названием ошибки', () => {
  const process = Object.assign(new EventEmitter(), { stderr: new EventEmitter() });
  observeProcessTokenUnauthorized(process as unknown as ChildProcess, 2, 4, 'old', 9);
  process.stderr.emit('data', 'Получено пользовательское сообщение FROZEN_METHOD_INVALID');
  expect(mocks.frozen).not.toHaveBeenCalled();
  process.emit('close');
});
