/** @fileoverview Постоянная история резервируется до Telegram и завершается до публикации итога. */
import { beforeEach, expect, it, vi } from 'vitest';
import type { BotToken } from '@shared/schema';
const mocks = vi.hoisted(() => ({ create: vi.fn(), check: vi.fn(), save: vi.fn(), finish: vi.fn(), get: vi.fn() }));
vi.mock('./check-telegram-bots', () => ({ checkTelegramBots: mocks.check }));
vi.mock('./telegram-bot-history-store', () => ({ telegramBotHistoryStore: {
  create: mocks.create, saveItem: mocks.save, finish: mocks.finish, get: mocks.get,
  interruptExpired: async () => undefined, heartbeat: async () => true,
} }));
import { telegramBotCheckTask } from './telegram-bot-check-task';
/** Безопасный сохранённый снимок задачи. */
const run = { id: 1, projectId: 12, scopeTokenId: 9, status: 'running', total: 1,
  result: { items: [], available: 0, unavailable: 0, errors: 0 } };
const tokens = [{ id: 9, projectId: 12, name: 'Бот', token: 'private-secret' }] as BotToken[];
beforeEach(() => { vi.resetAllMocks(); });
/** Два одновременных POST резервируют только одну запись до выполнения внешних действий. */
it('дедуплицирует резервирование и сохраняет каждый итог до завершения', async () => {
  let reserve!: (value: unknown) => void, complete!: (value: unknown) => void;
  mocks.create.mockImplementation(() => new Promise(resolve => { reserve = resolve; }));
  const item = { tokenId: 9, status: 'available' };
  const finished = { ...run, status: 'completed', result: { items: [item], available: 1, unavailable: 0, errors: 0 } };
  mocks.save.mockResolvedValue({ ...finished, status: 'running' }); mocks.finish.mockResolvedValue(finished);
  mocks.check.mockImplementation(async (_tokens, _progress, save) => {
    await save(item); return new Promise(resolve => { complete = resolve; });
  });
  const first = telegramBotCheckTask(12, 9, tokens), second = telegramBotCheckTask(12, 9, tokens);
  expect(first).toBe(second);
  await vi.waitFor(() => expect(mocks.create).toHaveBeenCalledOnce());
  expect(mocks.check).not.toHaveBeenCalled();
  expect(JSON.stringify(mocks.create.mock.calls)).not.toContain('private-secret');
  reserve({ run, created: true });
  const task = await first;
  await vi.waitFor(() => expect(mocks.save).toHaveBeenCalledOnce());
  expect(mocks.finish).not.toHaveBeenCalled();
  complete(finished.result);
  expect(await task.promise).toEqual(finished.result);
  expect(task.run.status).toBe('completed');
  expect(mocks.finish).toHaveBeenCalledOnce();
});
/** Присоединение другого сервера читает историю, не повторяя запросы Telegram. */
it('восстанавливает чужой активный запуск без повторной проверки', async () => {
  const finished = { ...run, id: 2, projectId: 13, status: 'completed' };
  mocks.create.mockResolvedValue({ run: { ...finished, status: 'running' }, created: false });
  mocks.get.mockResolvedValue(finished);
  const task = await telegramBotCheckTask(13, 9, tokens);
  await task.promise;
  expect(mocks.check).not.toHaveBeenCalled(); expect(mocks.get).toHaveBeenCalledWith(13, 2);
  expect(task.run.status).toBe('completed');
});
