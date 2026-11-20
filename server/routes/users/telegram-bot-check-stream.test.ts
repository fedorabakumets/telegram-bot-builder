/** @fileoverview Проверка настоящего потокового HTTP-ответа и совместимости обычного JSON. */
import { afterAll, beforeAll, expect, it, vi } from 'vitest';
import express from 'express';
import { createServer } from 'node:http';
import type { TelegramBotCheckItem, TelegramBotCheckResult } from '../../../shared/telegram-bot-check';
const mocks = vi.hoisted(() => ({ check: vi.fn(), finish: vi.fn(), active: vi.fn() }));
vi.mock('../../storages/storage', () => ({ storage: { getBotTokensByProject: async (projectId: number) => [
  { id: 9, projectId, token: 'private-secret', name: 'Первый' }, { id: 10, projectId, token: 'private-secret', name: 'Второй' },
] } }));
vi.mock('./check-telegram-bots', () => ({ checkTelegramBots: mocks.check }));
/** История изолирована от рабочей базы; имитируются только безопасные DTO. */
vi.mock('./telegram-bot-history-store', () => {
  let next = 0;
  const runs = new Map<number, any>();
  return { BotHistoryConflictError: class extends Error {}, telegramBotHistoryStore: {
    getActive: mocks.active,
    interruptExpired: async () => undefined,
    create: async ({ projectId, scopeTokenId, tokens }: any) => {
      const run = { id: ++next, projectId, scopeTokenId, status: 'running', total: tokens.length,
        startedAt: '2026-11-17T00:00:00.000Z', finishedAt: null, result: { items: [], available: 0, unavailable: 0, errors: 0 } };
      runs.set(run.id, run); return { run, created: true };
    },
    saveItem: async (_projectId: number, id: number, _worker: string, item: TelegramBotCheckItem) => {
      const run = runs.get(id), items = [...run.result.items, item];
      run.result = { items, available: items.filter(value => value.status === 'available').length,
        unavailable: items.filter(value => value.status === 'unavailable').length, errors: items.filter(value => value.status === 'error').length };
      return { ...run };
    },
    finish: async (_projectId: number, id: number) => {
      mocks.finish(id); const run = runs.get(id); run.status = 'completed'; run.finishedAt = '2026-11-17T00:00:01.000Z'; return { ...run };
    },
    heartbeat: async () => true,
  } };
});
import { checkTelegramBotsHandler, getActiveTelegramBotCheckHandler } from './check-telegram-bots-handler';
const app = express(); app.use(express.json()); app.post('/api/projects/:projectId/check', checkTelegramBotsHandler);
app.get('/api/projects/:projectId/active', getActiveTelegramBotCheckHandler);
const server = createServer(app); let base = '';
beforeAll(async () => {
  await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
  const address = server.address(); base = `http://127.0.0.1:${typeof address === 'object' ? address!.port : 0}`;
});
afterAll(async () => { server.closeAllConnections(); await new Promise<void>(resolve => server.close(() => resolve())); });
/** Подписчик получает результат первого бота, когда общий результат ещё не готов. */
it('передаёт прогресс по HTTP до завершения всей задачи', async () => {
  let report!: (result: TelegramBotCheckResult) => void, finish!: (result: TelegramBotCheckResult) => void;
  mocks.check.mockImplementation((_tokens, _observer, onItem) => {
    report = result => { void onItem(result.items[result.items.length - 1]); };
    return new Promise(resolve => { finish = async result => { await onItem(result.items[result.items.length - 1]); resolve(result); }; });
  });
  const response = await fetch(`${base}/api/projects/12/check`, { method: 'POST', headers: { Accept: 'application/x-ndjson', 'Content-Type': 'application/json' }, body: '{}' });
  expect(response.headers.get('content-type')).toContain('application/x-ndjson');
  const reader = response.body!.getReader(), decoder = new TextDecoder();
  expect(decoder.decode((await reader.read()).value)).toContain('"type":"progress"');
  const partial: TelegramBotCheckResult = { items: [{ tokenId: 9, status: 'available' }], available: 1, unavailable: 0, errors: 0 };
  report(partial);
  const text = decoder.decode((await reader.read()).value);
  expect(text).toContain('"runId":'); expect(text).toContain('2026-11-17T00:00:00.000Z');
  expect(text).toContain('"tokenId":9'); expect(text).not.toContain('private-secret');
  const final: TelegramBotCheckResult = { ...partial, items: [...partial.items, { tokenId: 10, status: 'error' }], errors: 1 };
  finish(final);
  let tail = '';
  for (;;) { const value = await reader.read(); if (value.done) break; tail += decoder.decode(value.value); }
  expect(mocks.finish).toHaveBeenCalled(); expect(tail).toContain('"status":"completed"');
  expect(tail).toContain('"type":"complete"'); expect(tail).not.toContain('private-secret');
});
/** Интеграции без потокового Accept продолжают получать прежний объект результата. */
it('сохраняет прежний JSON для обычных клиентов', async () => {
  const result = { items: [], available: 0, unavailable: 0, errors: 0 };
  mocks.check.mockResolvedValue(result);
  const response = await fetch(`${base}/api/projects/13/check`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  expect(response.status).toBe(200); expect(await response.json()).toEqual(result);
});

/** Восстановление текущего запуска является чтением и не вызывает проверку. */
it('читает активный запуск без обращения к Telegram', async () => {
  const before = mocks.check.mock.calls.length;
  mocks.active.mockResolvedValue({ id: 15, projectId: 12, scopeTokenId: 9, status: 'running' });
  const response = await fetch(`${base}/api/projects/12/active?tokenId=9`);
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ run: { id: 15, projectId: 12, scopeTokenId: 9, status: 'running' } });
  expect(mocks.active).toHaveBeenCalledWith(12, 9);
  expect(mocks.check).toHaveBeenCalledTimes(before);
});
